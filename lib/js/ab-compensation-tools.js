/*!
The License for the Government of Alberta source code is a modified version of the MIT License (MIT).

Government of Alberta

Copyright (c) 2016 Government of Alberta

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This license shall be governed by and interpreted in accordance with the laws in force in Alberta, Canada, and all claims arising out of or relating to this license or the Software will be litigated exclusively in the jurisdiction of Alberta, Canada.
*/
'use strict';

var abCompToolkit = (function (window, undefined) {
    var version = "";
    var loaded_jQuery = false;

    // Define $ as jQuery's alias in the scope of this project, will be assigned after loading the library
    var $ = null;

    var MIN_JQUERY_VERSION = "1.8.3";
        // Toolkit components on CDNs
    var url_jquery_js =
        "//code.jquery.com/jquery-1.8.3.min.js";
    var url_papaparse_js =
        "//cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js";
    var url_jsgrid_js =
        "//cdnjs.cloudflare.com/ajax/libs/jsgrid/1.4.1/jsgrid.min.js";
    var url_jsgrid_css =
        "//cdnjs.cloudflare.com/ajax/libs/jsgrid/1.4.1/jsgrid.min.css";
    var url_jsgrid_theme_css = 
        "//cdnjs.cloudflare.com/ajax/libs/jsgrid/1.4.1/jsgrid-theme.min.css";
    var url_grid_css =
        "//abgov.github.io/ab-compensation-transparency-toolkit/cdn/lib/css/ab-compensation-tools" +
        ((version != null && typeof version == 'string' && version != "") ? ("-" + version) : "") +
        ".css";
        
    var theJsGrid = null;
    var strHeaderCss = "";
    var csvFileUrl = "disclosure.csv";
    var data, errors, meta;
    var strHeaderCss = "";

    var csvShowErrors = typeof (showErrors) == 'boolean' ?
        showErrors : false;

    function setupToolkit() {
            
        if (typeof (jquery_js) == 'string')
            url_jquery_js = jquery_js;
        if (typeof (papaparse_js) == 'string')
            url_papaparse_js = papaparse_js;
        if (typeof (jsgrid_js) == 'string')
            url_jsgrid_js = jsgrid_js;
        if (typeof (jsgrid_css) == 'string')
            url_jsgrid_css = jsgrid_css;
        if (typeof (jsgrid_theme_css) == 'string')
            url_jsgrid_theme_css = jsgrid_theme_css;
        if (typeof (grid_css) == 'string')
            url_grid_css = grid_css;
        
        if (typeof (jQuery) !== 'function') {
            loaded_jQuery = loadJsCssfile(url_jquery_js, "js", "jquery_js");
        }
        else {
            //we may still need to load jQuery again if the current version is insufficient
            if (!isjQueryCurrent(jQuery.fn.jquery)) {
                console.log(
                    "Current jQuery version " + jQuery.fn.jquery +
                    " is too old, the toolkit will load a newer version.");
                loaded_jQuery = loadJsCssfile(url_jquery_js, "js", "jquery_js");
            }
        }
        
        // Poll for jQuery to come into existance
        var jQueryReady = function (callback) {
            if (typeof(jQuery) == 'function' && isjQueryCurrent(jQuery.fn.jquery)) {
                // Assign jQuery to $ as its alias within the sceope of this project
                $ = jQuery;
                // If necessary, recover $ in the global scope outside this project
                if (loaded_jQuery) {
                    $.noConflict();
                }

                callback($);
            }
            else {
                window.setTimeout(function () { jQueryReady(callback); }, 100);
            }
        };
                    
        // Start polling jQuery...
        jQueryReady(function ($) {
            // Use $ here...
            loadResources();
        
            var toolkitReady = function (callback) {
                if (typeof (Papa) == 'object' &&
                    typeof (jsGrid) == 'object') {
                    callback($);
                }
                else {
                    window.setTimeout(function () { toolkitReady(callback); }, 100);
                }
            };
            // Start polling toolkit...
            toolkitReady(function ($) {
                // Use toolkit from here...
                allReady($);
            });
        });
    }

    function loadResources() {
        loadJsCssfile(url_jsgrid_css, "css", "jsgrid_css");
        loadJsCssfile(url_jsgrid_theme_css, "css", "jsgrid_theme_css");
        loadJsCssfile(url_grid_css, "css", "grid_css");

        if (!window.Papa) {
            loadJsCssfile(url_papaparse_js, "js", "papaparse_js");
        }
        if (!window.jsGrid) {
            loadJsCssfile(url_jsgrid_js, "js", "jsgrid_js");
        }
    }

    function loadJsCssfile(url, type, resource) {
        var loaded = false;
        if (!url || !type || !resource) {
            console.log(
                "File not loaded by the toolkit, resource: " + (resource ? "'" + resource + "'" : "Unknown") +
                ", type: " + (type ? "'" + type + "'" : "Unknown") +
                ", url: " + (url ? +"'" + url + "'" : "Empty") +
                ".");
        } else {
            var fileref = null;
            switch (type.toLowerCase()) {
                case "js":
                case "javascript":
                case "text/javascript":
                    fileref = document.createElement('script');
                    fileref.setAttribute("type", "text/javascript");
                    fileref.setAttribute("src", url);
                    break;
                case "css":
                case "text/css":
                    fileref = document.createElement("link");
                    fileref.setAttribute("rel", "stylesheet");
                    fileref.setAttribute("type", "text/css");
                    fileref.setAttribute("href", url);
                    break;
                default:
                    fileref = null;
                    break;
            }
            if (fileref != null) {
                document.getElementsByTagName("head")[0].appendChild(fileref);
                loaded = true;
            }
        }
        return loaded;
    }

    function isjQueryCurrent(versionString) {
        var vernums = versionString.split('.');
        var minVernums = MIN_JQUERY_VERSION.split('.');
        //we need to reformat the version number into a valid decimal - using thousands to ensure a valid comparison. e.g. 1.8.3 --> 1008003
        if (parseInt(vernums[0]) * 1000000 + ((vernums.length > 1) ? parseInt(vernums[1]) * 1000 : 0) + ((vernums.length > 2) ? parseInt(vernums[2]) : 0) < 
            parseInt(minVernums[0]) * 1000000 + ((minVernums.length > 1) ? parseInt(minVernums[1]) * 1000 : 0) + ((minVernums.length > 2) ? parseInt(minVernums[2]) : 0))
            return false;
        else return true;
    }

    function allReady($) {
        $(document).ready(function ($) {
            getSalaryData();
        });
        //set event to clear filters when user clicks away
        $("body").click(function() {
            $(".filter-form.active").slideUp().removeClass("active");
        });
    }

    function getSalaryData() {
        if (typeof (csv) == 'string')
            csvFileUrl = csv;
        Papa.parse(csvFileUrl, {
            download: true,
            delimeter: ',',
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                //Papa Parse sometimes adds a blank row to the end of the data set, if this happens, remove it
                if (!results.data[results.data.length - 1].hasOwnProperty("PublicSectorBody"))
                    results.data.splice(results.data.length - 1, 1);
                data = results.data;
                errors = results.errors;
                meta = results.meta;
                // Data format check
                var formatErrors = {};
                function summaryAddError(errorsArray, error) {
                    if (!errorsArray[error])
                        errorsArray[error] = 1;
                    else
                        errorsArray[error]++;
                }
                data.forEach(function (item, index) {
                    var error = null;
                    // Missing required column(s)
                    if (item.PublicSectorBody == null) {
                        error = "Missing PublicSectorBody column";
                        summaryAddError(formatErrors, error);
                        item.PublicSectorBody = "";
                    }
                    // Text columns
                    item.PublicSectorBody = item.PublicSectorBody.trim();
                    item.Name = item.Name.trim();
                    item.Position = item.Position.trim();
                    // Numeric columns
                    if (isNaN(item.Compensation) ||
                        isNaN(item.Other) ||
                        isNaN(item.Severance)) {
                        item.Compensation = item.Compensation.replace(/[^0-9.]/g, "");
                        item.Other = item.Other.replace(/[^0-9.]/g, "");
                        item.Severance = item.Severance.replace(/[^0-9.]/g, "");
                        // Check again after recovery attempt
                        if (isNaN(item.Compensation) ||
                            isNaN(item.Other) ||
                            isNaN(item.Severance)) {
                            error = item.PublicSectorBody + ": Numeric column(s) format error";
                            summaryAddError(formatErrors, error);
                        }
                        else {
                            error = item.PublicSectorBody + ": Numeric column(s) format error recovered";
                            summaryAddError(formatErrors, error);
                        }
                    }
                    // Year column
                    if (isNaN(item.Year) || item.Year.length < 4) {
                        error = item.PublicSectorBody + ": Year column format error";
                        summaryAddError(formatErrors, error);
                    }
                    // Record with all columns empty
                    if (!item.PublicSectorBody &&
                        !item.Name &&
                        !item.Position &&
                        !item.Year &&
                        !item.Compensation &&
                        !item.Other &&
                        !item.Severance) {
                        error = item.PublicSectorBody + ": Record with all columns empty";
                        summaryAddError(formatErrors, error);
                    }
                    // Empty on required column(s) after recovery
                    else if (!item.PublicSectorBody ||
                        !item.Name ||
                        !item.Position ||
                        !item.Year ||
                        !item.Compensation ||
                        !item.Other ||
                        !item.Severance) {
                        error = item.PublicSectorBody + ": No valid value on required column(s)";
                        summaryAddError(formatErrors, error);
                    }
                });
                // Summary of format errors
                if (csvShowErrors) {
                    for (var error in formatErrors) {
                        console.log(formatErrors[error] + " \t" + error)
                    }
                }

                loadGrid();
            }
        });
    };

    function headerInnerHtml(self) {
        var output =
        '<div class="grid-header-cell">';
        if (self.filtering || self.sorting) {
            output +=
            '<div class="grid-header-tags-push-down"></div>' +
            '<div class="grid-header-tags">' +
                '<span class="sort-tag"></span>';
            if (self.filtering) output +=
                '<a class="grid-filter" href="#" tabindex="-1" onclick="abCompToolkit.onFilterClick(event, \'' + self.name + '\');"><span class="filter-icon"></span></a>';
            output +=
            '</div>';
        }
        output +=
            '<span title="' + ((self.tooltip) ? self.tooltip : self.title) + '" class="jsgrid-header-label">' + self.title + '</span>' +
        '</div>';
        return output;
    }

    function _filterTemplate_Numeric(self) {
        var $result = "";
        if (self.filtering) {
            var grid = self._grid,
                $result = self.filterControl = _createNumericFilter();
            if (self.autosearch) {
                $result.on("change", function (e) {
                    grid.search();
                });
            }
        }
        return $result;
    }

    function _createNumericFilter() {
        var $select = $("<select>");
        $("<option>")
            .attr("value", "==")
            .text("Equals")
            .appendTo($select);
        $("<option>")
            .attr("value", ">=")
            .text("Greater or Equals")
            .appendTo($select);
        $("<option>")
            .attr("value", "<=")
            .text("Less or Equals")
            .appendTo($select);
        var $input = $('<input>')
            .attr("type", "number");
        var $result = $select.add($input);
        return $result;
    }

    function _getNumericFilterValue(self) {
        var result = "";
        var $filter = self.filterControl;
        if ($filter) {
            var $select = $filter[0];
            var $input = $filter[1];
            if ($select && $input) {
                if ($input.value && $input.value != "")
                    result = $select.value + " " + $input.value;
            }
        }
        return result;
    }

    function _parseSignAndRight(signAndRight) {
        var _signAndRight = signAndRight
            ? signAndRight.trim().replace(/[^0-9.><=+-]/g, "")
            : "";
        var matches = _signAndRight.match(/^(>=|<=|==|=|>|<)([0-9.+-]+)$/);
        var _sign = matches[1] ? matches[1] : "";
        var _right = matches[2] ? matches[2] : "";

        if (!_right || isNaN(_right)) {
            _right = 0;
        }
        return { sign: _sign, right: _right };
    }

    function _inequation(_left, _sign, _right) {
        var result = true;
        if (!_left || isNaN(_left)) {
            _left = 0;
        }
        _left = Number(_left);
        _sign = String(_sign);
        _right = Number(_right);
        switch (_sign) {
            case ">=":
                result = _left >= _right;
                break;
            case "<=":
                result = _left <= _right;
                break;
            case "==":
            case "=":
                result = _left == _right;
                break;
            case "<":
                result = _left < _right;
                break;
            case ">":
                result = _left > _right;
                break;
            default:
                result = true;
                console.log("Not evaluated: " + _left + " / " + _sign + " / " + _right);
        }
        return result;
    }
    
    function indexOfCaseInsensitive(str, pattern) {
        return str.toLowerCase().indexOf(pattern.toLowerCase());
    }

    function _activateHeaderFilter (filter) {
        var arrFilters = $.map(filter, function (e) { return e; });
        var $headers = $(".jsgrid-grid-header .jsgrid-header-row th").has("a[class='grid-filter']");
        arrFilters.forEach(function (item, index) {
            if (!!item)
                $headers.eq(index).addClass("active");
            else
                $headers.eq(index).removeClass("active");
        });
    }
       
    function renderAttachments(contract, termination) {
        var output = '';
        if (contract != null && contract != "") {
            output = '<a class="attachmentLink" href="' + contract + '" target="_blank" title="Contract Attachment">C</a>';
        }
        if (termination != null && termination != "") {
            if (output.length > 0) output += '&nbsp;&nbsp;&nbsp;&nbsp;';
            output += '<a class="attachmentLink" href="' + termination + '" target="_blank" title="Termination Attachment">T</a>';
        }
        return output;
    }

    function renderDollarAmount(amount) {
        var output = '';
        if (amount === undefined || amount == '')
            output = '';
        else if (isNaN(amount))
            output = amount;
        else
            output = '$' + ((1 * amount).toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return output;
    }

    function _sorterNumericEnhenced(n1, n2) {
        var diff;
        if (!n1 || isNaN(n1))
            diff = -1;
        else if (!n2 || isNaN(n2))
            diff = 1;
        else
            diff = n1 - n2;
        return diff;
    }
    
    function loadGrid() {   
        
        //if grid is loaded before css file is applied, it will size itself incorrectly unless we add the needed rule manually..
        var sizeFix = document.createElement('style');
        document.head.appendChild(sizeFix);
        var sizeFixSheet = sizeFix.sheet;
        sizeFixSheet.insertRule('.jsgrid-table { width: 100%; }', 0);
        sizeFixSheet.insertRule('.grid-body { overflow: hidden; }', 0);
        
        
        var gridConfig = {
            fields: [{
                name: "PublicSectorBody",
                title: "Public Sector Body",
                type: "text",
                width: "auto",
                sorter: "string",
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filtercss: "filter-form PublicSectorBody-filter",
                headercss: strHeaderCss,
            }, {
                name: "Name",
                title: "Name",
                type: "text",
                width: "auto",
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filtercss: "filter-form Name-filter",
                headercss: strHeaderCss,
            }, {
                name: "Position",
                title: "Position",
                type: "text",
                width: "auto",
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filtercss: "filter-form Position-filter",
                headercss: strHeaderCss,
            }, {
                name: "Year",
                title: "Year",
                type: "number",
                width: "6.6%",
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filtercss: "filter-form Year-filter",
                headercss: strHeaderCss,
            }, {
                name: "Compensation",
                title: "Compensation",
                tooltip: "Compensation: Income plus taxable benefits paid to a member or employee. Excludes severance.",
                type: "number",
                width: "14%",
                sorter: function (n1, n2) {
                    return _sorterNumericEnhenced(n1, n2);
                },
                cellRenderer: function (value, item) {
                    return "<td>" + renderDollarAmount(item["Compensation"]) + "</td>";
                },
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filterTemplate: function () {
                    return _filterTemplate_Numeric(this);
                },
                filterValue: function () {
                    return _getNumericFilterValue(this);
                },
                filtercss: "filter-form Compensation-filter",
                headercss: strHeaderCss,
            }, {
                name: "Other",
                title: "Other",
                tooltip: "Other: Non-taxable benefits, incudes public sector body’s share of pension and other contributions.",
                type: "number",
                width: "9.7%",
                sorter: function (n1, n2) {
                    return _sorterNumericEnhenced(n1, n2);
                },
                cellRenderer: function (value, item) {
                    return "<td>" + renderDollarAmount(item["Other"]) + "</td>";
                },
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filterTemplate: function () {
                    return _filterTemplate_Numeric(this);
                },
                filterValue: function () {
                    return _getNumericFilterValue(this);
                },
                filtercss: "filter-form Other-filter",
                headercss: strHeaderCss,
            }, {
                name: "Severance",
                title: "Severance",
                tooltip: "Severance: Includes payments when employment or member’s appointment ends or retiring allowance.",
                type: "number",
                width: "11%",
                sorter: function (n1, n2) {
                    return _sorterNumericEnhenced(n1, n2);
                },
                cellRenderer: function (value, item) {
                    return "<td>" + renderDollarAmount(item["Severance"]) + "</td>";
                },
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                filterTemplate: function () {
                    return _filterTemplate_Numeric(this);
                },
                filterValue: function () {
                    return _getNumericFilterValue(this);
                },
                filtercss: "filter-form Severance-filter",
                headercss: strHeaderCss,
            }, {
                name: "Attachments",
                title: "Attachments",
                tooltip: "Attachments: An employment contract (C) or severance agreement (S) for certain designated employees or members. If neither document is applicable, no attachment is posted.",
                type: "text",
                width: "9%",
                filtering: false,
                sorting: false,
                cellRenderer: function (value, item) {
                    return "<td>" + renderAttachments(item["ContractAttachment"], item["TerminationAttachment"]) + "</td>";
                },
                headerTemplate: function () {
                    return headerInnerHtml(this);
                },
                headercss: strHeaderCss,
                filtercss: "filter-form",
            }],
            autoload: true,
            controller: {
                loadData: function (filter) {
                    _activateHeaderFilter(filter);
                    var filter_Compensation, filter_Other, filter_Severance;
                    if (filter.Compensation)
                        filter_Compensation = _parseSignAndRight(filter.Compensation);
                    if (filter.Other)
                        filter_Other = _parseSignAndRight(filter.Other);
                    if (filter.Severance)
                        filter_Severance = _parseSignAndRight(filter.Severance);
                    return $.grep(data, function (data) {
                        return (
                            (!filter.PublicSectorBody || indexOfCaseInsensitive(data.PublicSectorBody, filter.PublicSectorBody) > -1) &&
                            (!filter.Name || indexOfCaseInsensitive(data.Name, filter.Name) > -1) &&
                            (!filter.Position || indexOfCaseInsensitive(data.Position, filter.Position) > -1) &&
                            (!filter.Year || data.Year == filter.Year) &&
                            (!filter.Compensation || _inequation(data.Compensation, filter_Compensation["sign"], filter_Compensation["right"])) &&
                            (!filter.Other || _inequation(data.Other, filter_Other["sign"], filter_Other["right"])) &&
                            (!filter.Severance || _inequation(data.Severance, filter_Severance["sign"], filter_Severance["right"])));
                    });
                },
            },
            refresh: function() {
                //prevent refresh from undoing custom filter code
                this._callEventHandler(this.onRefreshing);
                this.cancelEdit();
                this._refreshHeading();
                //this._refreshFiltering();
                this._refreshInserting();
                this._refreshContent();
                this._refreshPager();
                this._refreshSize();
                this._callEventHandler(this.onRefreshed);
            },
            _refreshWidth: function () {
                var $headerGrid = this._headerGrid,
                    $bodyGrid = this._bodyGrid,
                    width = this.width;

                if (width === "auto") {
                    $headerGrid.width("auto");
                    //width = $headerGrid.outerWidth();
                    width = $headerGrid.width();
                }

                $headerGrid.width("");
                $bodyGrid.width("");
                this._container.width(width);
                //width = $headerGrid.outerWidth();
                width = $headerGrid.width();
                $bodyGrid.width(width);
            },
            width: "100%",
            height: "auto",
            pageSize: 10,
            selecting: false,
            filtering: true,
            sorting: true,
            paging: true,
            
        };

        // give users a change to alter the configuration of the grid before
        // it is rendered.
        if ( typeof (gridConfigCallback) == 'function' ) {
            var newConfig = gridConfigCallback( gridConfig, $ );
            if ( newConfig != null ) {
                // ensure even those that forget to return the config will have
                // a working grid.
                gridConfig = newConfig;
            }
        }

        theJsGrid = $("#grid").jsGrid(gridConfig);

        var $headerFilters = $('.filter-form');
        $headerFilters.each(function (index, item) {
            $headerFilters.eq(index).
                append('<br><button id="filter-apply-' + index + '" type="button" onclick="abCompToolkit.onApplyClick(event, this)">Filter</button>' +
                '<button id="filter-clear-'+ index +'" type="button" onclick="abCompToolkit.onClearClick(event, this, ' + index + ')">Clear</button>');
        });

        // Give users a chance to overwrite the default after render actions
        // by a customization after-render callback
        if (typeof (gridAfterRenderCallback) == 'function') {
            var newConfig = gridAfterRenderCallback(gridConfig, $);
            if (newConfig != null) {
                gridConfig = newConfig;
            }
        } else {
            // Default after render actions
            $("#grid table")
                .css("margin", "0px")
                .css("padding", "0px")
                .css("width", "100%");
            $("#grid .jsgrid-header-sortable").has(".grid-header-tags").addClass("grid-header-tags-contained");
            $(window).resize(function () {
                var header_row_ths =
                    "#grid div.jsgrid-grid-header tr.jsgrid-header-row th";
                var header_cells =
                    "#grid div.jsgrid-grid-header tr.jsgrid-header-row div.grid-header-cell";
                var header_tags_push_downs =
                    "#grid div.jsgrid-grid-header tr.jsgrid-header-row div.grid-header-cell div.grid-header-tags-push-down";
                var header_tags =
                    "#grid div.jsgrid-grid-header tr.jsgrid-header-row div.grid-header-cell div.grid-header-tags";
                $(header_tags_push_downs).height(0);
                $(header_cells).height("100%");
                var height_cell = $(header_row_ths).height();
                $(header_cells).height(height_cell);
                var height_tags =$(header_tags).outerHeight();
                $(header_tags_push_downs).height(height_cell - height_tags);
            });
            $(window).resize();
            setInterval(function () {
                $(window).trigger("resize");
            }, 500);
        }

    }

    return {
        
        init: function() {
            setupToolkit();
        },
        
        onFilterClick: function(e, columnName) {
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            e.stopPropagation();
            var filterForm = $('.' + columnName + '-filter');
            if ($(filterForm).hasClass('active')) {
                $('.filter-form.active').slideUp().removeClass('active');
            }
            else {
                $('.filter-form.active').slideUp().removeClass('active');
                $(filterForm).click( function(e) {
                    e.stopPropagation();
                });
                filterForm.show();
                filterForm.width('auto');
                filterForm.offset({ left: $(e.currentTarget).offset().left - filterForm.width() });
                $(filterForm).slideDown().addClass("active");
            }
            if (Number($(filterForm).css("left").replace(/px$/, "")) < 0)
                $(filterForm).css("left", "0px");
        },
        
        onApplyClick: function(e, self) {
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            $('.filter-form.active').slideUp().removeClass('active');
            $("#grid").jsGrid("search");
        },

        onClearClick: function(e, self, index) {
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            $('.filter-form.active').slideUp().removeClass('active');
            var $header = $('.filter-form').eq(index);
            $header.find("input").val("");
            $header.find("select").val("");
            $("#grid").jsGrid("search");
        },

        version: ((version != null && typeof version == 'string' && version != "") ? version : ""),
    }

}(window));

abCompToolkit.init();
