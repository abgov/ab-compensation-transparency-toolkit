# Alberta Compensation Transparency Toolkit
Open Source toolkit to support disclosures under Alberta's Public Sector Compensation Transparency Act

For instructions, see the implementation guide at http://abgov.github.io/ab-compensation-transparency-toolkit/.

## Overview

The Alberta Compensation Transparency Toolkit is a JavaScript toolkit built to simplify the process of setting up a rich interactive grid for compensation transparency web pages. With the data from a CSV file, it automatically generates a table that comes with paging, navigation, sorting and filtering functionality.

The toolkit is powered by [Papa Parse](http://papaparse.com/) and [jsGrid](http://js-grid.com/), both of which are open source free software under [MIT license](https://en.wikipedia.org/wiki/MIT_License). The toolkit will load the components dynamically at runtime.

The CSV file contains columns defined in the [implementation guide](http://abgov.github.io/ab-compensation-transparency-toolkit/). The toolkit uses Papa Parse to convert the data to an array of JSON objects like the example below, then uses jsGrid to generate the table on the web page.

```
[{
   "PublicSectorBody" : "Public Sector Body 1",
   "Position" : "Senior Manager",
   "Name" : "Lever,Mackenzie",
   "Year" : "2015",
   "Compensation" : "152001.00",
   "Other" : "200.00",
   "Severance" : "0.00",
   "ContractAttachment" : "",
   "TerminationAttachment" : "attach/termination/T-XXXXX.pdf"
  },
  { ... },
  ...
];
```

## Project structure
```
ab-compensation-transparency-toolkit
│
│   index.html         : Documentation page.
│   template.xlsx      : Empty template Excel file for creating CSV.
│   ab-compensation-transparency-toolkit-all.zip
│                      : Toolkit package for self-hosting.
│
├───pages              : Assets referenced by the documentation page.
│       ...
│
├───lib                : Source code for the toolkit.
│   │
│   ├───css            : The CSS files and images.
│   │       ...
│   │
│   └───js             : The JavaScript files.
│           ...
│
├───cdn                : Published copies of the toolkit resources, intended for access through 
│   │                    github.io. These files are updated only when new releases are prepared.
│   │
│   └───lib            : Has the same folder structure as lib/ directory above.
│           ...
│
├───demo               : Sample html referencing the most recent release versions of the toolkit.
│   │
│   │   disclosure.csv
│   │   grid-only.html
│   │   sample-page.html
│   │
│   └───attach          : Sample attachment files.
│            ...
│
└───test                : Html pages similar to demo, but uses relative URLs to reference local 
        ...               development assets.

```

## Branches
- `master` contains the source code and documents undergoing development.
- `gh-pages` pulls from the `master` branch, as the published versions of the toolkit.

## How to contribute

Bugs and other issues can be reported to the GitHub project [issue tracker](https://github.com/abgov/ab-compensation-transparency-toolkit/issues).

If you wish to customize the solution or contribute fixes, the `master` branch will receive more frequent updates and is best suited for local testing and debugging.

Please submit a ticket to the [issue tracker](https://github.com/abgov/ab-compensation-transparency-toolkit/issues) before committing any source code change, so that it will be easier to review and merge.

## License

Code licensed under a [modified MIT](https://raw.githubusercontent.com/abgov/ab-compensation-transparency-toolkit/gh-pages/LICENSE) license.
