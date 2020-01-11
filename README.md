# ReqsLang - Requirements management tool for Continuous Development.

# Introduction 
It allows you to manage, store and process requirements documents in similar manner to the source code. The goal is to deliver customizable environment for manipulation of text-based requirements files, that can be stored in source code repository and evaluated by Continuous Integration tools.

# Getting Started
This section tells how to make code up and running on your system. In this section we talk about:
1.	Installation process
* Download this repository
* Obtain [NodeJS](https://nodejs.org/) and install [NPM package manager](https://www.npmjs.com/)
* Run command in ReqsLang sub-directory `npm install`
* To start with requirements project (examples.rsproj in this case) run command `node app.js  ../ReqsLang.Examples/examples.rsproj`
* For more options `run node app.js -h`
2.	Software dependencies
For details please see package.json in ReqsLang folder.
Key libraries are:
* Processing requirements and templates:
  - [JSONPath]( https://github.com/dchester/jsonpath) to extract data from JSON structures
  - [ajv](https://github.com/epoberezkin/ajv) to evaluate JSON Schema
  - [CommonMark]( https://github.com/commonmark/commonmark.js) to extract content of MarkDown files
  - [Knex]( https://github.com/knex/knex) to operate over database
* Other libraries:
  - log4js logging library
  - node-dependency-injection container to IoC
  - rxJS provides observable infrastructure
  - sqlite3 is used for in-memory database to validate requirements
3.	Latest releases
It is initial release of a prototype. There is no warranty that file structure or functions stay the same.
4.	API references
Except of API available in Node and libraries, no additional API is used. Software works off-line.
# Build and Test
No specific build steps except of above.
To run small test suite, use command `npm test`

# Reading
* [Requirement Engineering as a Software Development Process](https://www.researchgate.net/publication/337939674_Requirement_Engineering_as_a_Software_Development_Process) Initial description of prototype
* [rmToo – Requirements Management Tool](http://rmtoo.florath.net/) Similar tool to the ReqsLang

