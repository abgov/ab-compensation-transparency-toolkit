﻿/*!
The License for the Government of Alberta source code is a modified version of the MIT License (MIT).

Government of Alberta

Copyright (c) 2016 Government of Alberta

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This license shall be governed by and interpreted in accordance with the laws in force in Alberta, Canada, and all claims arising out of or relating to this license or the Software will be litigated exclusively in the jurisdiction of Alberta, Canada.
*/
'use strict';

var abCompToolkit = (function() {
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
        "//abgov.github.io/ab-compensation-transparency-toolkit/cdn/lib/css/ab-compensation-tools.css";
        
    var theJsGrid = null;
    var strHeaderCss = "";
    var csvFileUrl = "disclosure.csv";
    var data, errors, meta;
    var strHeaderCss = "";

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
            loadJsCssfile(url_jquery_js, "js");
        }
        else {
            //we may still need to load jQuery again if the current version is insufficient
            if (!isjQueryCurrent(jQuery.fn.jquery))   
                loadJsCssfile(url_jquery_js, "js");
        }
        
        // Poll for jQuery to come into existance
        var jQueryReady = function (callback) {
            if (typeof(jQuery) == 'function' && isjQueryCurrent(jQuery.fn.jquery)) {
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
        if (!window.Papa) {
            loadJsCssfile(url_papaparse_js, "js");
        }
        if (!window.jsGrid) {
            loadJsCssfile(url_jsgrid_js, "js");
        }

        loadJsCssfile(url_jsgrid_css, "css");
        loadJsCssfile(url_jsgrid_theme_css, "css");
        loadJsCssfile(url_grid_css, "css");
    }

    function loadJsCssfile(url, type) {
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
        }
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
                loadGrid();
            }
        });
    };

    function headerInnerHtml(self) {
        var output =
            '<span title="' + ((self.tooltip) ? self.tooltip : self.title) + '" class="jsgrid-header-label">' + self.title + '</span>' +
            '<span class="sort-tag"></span>' 
            if (self.filtering) output += '<a class="grid-filter" href="#" tabindex="-1" onclick="abCompToolkit.onFilterClick(event, \'' + self.name + '\');"><span class="filter-icon"></span></a>';
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

    function _evaluateInequation(left, signAndRight) {
        var result = true;
        if (typeof (signAndRight) == "string" && signAndRight != "") {
            var inequation = left + " " + signAndRight;
            result = eval(inequation);
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
    
    function loadGrid() {   
        
        //if grid is loaded before css file is applied, it will size itself incorrectly unless we add the needed rule manually..
        var sizeFix = document.createElement('style');
        document.head.appendChild(sizeFix);
        var sizeFixSheet = sizeFix.sheet;
        sizeFixSheet.insertRule('.jsgrid-table { width: 100%; }', 0);
        sizeFixSheet.insertRule('.grid-body { overflow: hidden; }', 0);
        
        
        theJsGrid = $("#grid").jsGrid({
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
                width: "12.6%",
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
                    return $.grep(data, function (data) {
                        return (
                            (!filter.PublicSectorBody || indexOfCaseInsensitive(data.PublicSectorBody, filter.PublicSectorBody) > -1) &&
                            (!filter.Name || indexOfCaseInsensitive(data.Name, filter.Name) > -1) &&
                            (!filter.Position || indexOfCaseInsensitive(data.Position, filter.Position) > -1) &&
                            (!filter.Year || data.Year == filter.Year) &&
                            (!filter.Compensation || _evaluateInequation(data.Compensation, filter.Compensation)) &&
                            (!filter.Other || _evaluateInequation(data.Other, filter.Other)) &&
                            (!filter.Severance || _evaluateInequation(data.Severance, filter.Severance)));
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
            width: "100%",
            height: "auto",
            pageSize: 10,
            selecting: false,
            filtering: true,
            sorting: true,
            paging: true,
            
        });

        var $headerFilters = $('.filter-form');
        $headerFilters.each(function (index, item) {
            $headerFilters.eq(index).
                append('<br><button id="filter-apply-' + index + '" type="button" onclick="abCompToolkit.onApplyClick(event, this)">Filter</button>' +
                '<button id="filter-clear-'+ index +'" type="button" onclick="abCompToolkit.onClearClick(event, this, ' + index + ')">Clear</button>');
        });
          
    }

    return {
        
        init: function() {
            setupToolkit();
        },
        
        onFilterClick: function(e, columnName) {
            e.preventDefault();
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
        },
        
        onApplyClick: function(e, self) {
            e.preventDefault();
            $('.filter-form.active').slideUp().removeClass('active');
            $("#grid").jsGrid("search");
        },

        onClearClick: function(e, self, index) {
            e.preventDefault();
            $('.filter-form.active').slideUp().removeClass('active');
            var $header = $('.filter-form').eq(index);
            $header.find("input").val("");
            $header.find("select").val("");
            $("#grid").jsGrid("search");
        },
    }

}());

abCompToolkit.init();