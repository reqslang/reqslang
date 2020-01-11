module.exports = Container;

function Container(loaderArgs) {
    this.programArgs = loaderArgs;

    this.createContainer = function () {
        const ContainerBuilder = require('node-dependency-injection').ContainerBuilder;
        return new ContainerBuilder();
    };

    this.createReference = function (name) {
        const Reference = require('node-dependency-injection').Reference;
        return new Reference(name);
    };

    this.registerServices = function (c) {
        c.set('logger', this.createLoggerService());
        const logger = c.logger;
        this.logger = logger;
        c.register('fileService', this.createFileService());
        c.register('pathService', this.createPathService());
        c.register('jsonService', this.createJsonService());
        c.register('markService', this.createMarkService());
        c.register('jsonPathService', this.createJsonPathService());
        c.register('templatebuildservice', this.createTemplateBuildService());
        c.register('fileJsonService', this.createFileJsonService())
            .addArgument(this.createReference('fileService'))
            .addArgument(this.createReference('jsonService'))
            .addArgument(logger);
        c.register('fileMarkService', this.createfileMarkService())
            .addArgument(this.createReference('fileService'))
            .addArgument(this.createReference('markService'))
            .addArgument(logger);
        c.register('configService', this.createConfigService())
            .addArgument(this.createReference('fileJsonService'));
        c.register('schemaValidationService', this.createSchemaValidationService())
            .addArgument(logger);
        c.register('projectLoader', this.createProjectLoader())
            .addArgument(logger)
            .addArgument(this.createReference('fileJsonService'))
            .addArgument(this.createReference('schemaValidationService'))
            .addArgument(this.createReference('configService'))
            .addArgument(this.createReference('pathService'))
            .addArgument(this.createReference('templateLoader'))
            .addArgument(this.createReference('requirementLoader'))
            .addArgument(this.createReference('templatebuildservice'))
            .addArgument(this.createReference('templateDaoService'));
        c.register('templateLoader', this.createTemplateLoader())
            .addArgument(logger)
            .addArgument(this.createReference('fileJsonService'))
            .addArgument(this.createReference('schemaValidationService'))
            .addArgument(this.createReference('configService'))
            .addArgument(this.createReference('pathService'));
        c.register('requirementLoader', this.createRequirementLoader())
            .addArgument(logger)
            .addArgument(this.createReference('configService'))
            .addArgument(this.createReference('pathService'))
            .addArgument(this.createReference('fileMarkService'))
            .addArgument(this.createReference('jsonPathService'))
            .addArgument(this.createReference('schemaValidationService'))
            .addArgument(this.createReference('requirementDaoService'));
        c.register('mainLoader', this.createMainLoader())
            .addArgument(this.programArgs)
            .addArgument(logger)
            .addArgument(this.createReference('projectLoader'));
        const cds = c.register('databaseService', this.createDatabaseService())
            .addArgument(logger)
            .addArgument(this.createReference('configService'));
        c.register('templateDaoService', this.createTemplateDaoService())
            .addArgument(logger)
            .addArgument(this.createReference('databaseService'));
        c.register('requirementDaoService', this.createRequirementDaoService())
            .addArgument(logger)
            .addArgument(this.createReference('databaseService'));
    };

    this.getInstance = function (objectName) {
        const getterToCall = this.container.get;
        const instance = getterToCall.call(this.container, objectName);
        return instance;
    };

    //TODO move it to configuration and merge with runtime (if exits)
    this.createLoggerService = function () {
        const log4jsR = require('log4js');
        log4jsR.configure({
            appenders: { myConsole: { type: 'stdout' } },
            categories: { default: { appenders: ['myConsole'], level: 'info' } }
        });
        const logger = log4jsR.getLogger('myConsole');
        return logger;
    };

    this.createFileService = function () {
        const FileService = require('./service/fileservice');
        return FileService;
    };

    this.createPathService = function () {
        const PathService = require('./service/pathservice');
        return PathService;
    };

    this.createfileMarkService = function () {
        const service = require('./service/filemarkservice');
        return service;
    };

    this.createFileJsonService = function () {
        const FileJsonService = require('./service/filejsonservice');
        return FileJsonService;
    };

    this.createJsonService = function () {
        const JsonService = require('./service/jsonservice');
        return JsonService;
    };

    this.createConfigService = function () {
        const ConfigService = require('./service/configservice');
        ConfigService.programArgs = this.programArgs;
        return ConfigService;
    };

    this.createMarkService = function () {
        const MarkService = require('./service/markservice');
        return MarkService;
    };

    this.createSchemaValidationService = function () {
        const SchemaValidationService = require('./service/schemavalidationservice');
        return SchemaValidationService;
    };

    this.createProjectLoader = function () {
        const ProjectLoader = require('./loader/project/projectloader');
        return ProjectLoader;
    };

    this.createTemplateLoader = function () {
        const TemplateLoader = require('./loader/template/templateloader');
        return TemplateLoader;
    };

    this.createRequirementLoader = function () {
        const RequirementLoader = require('./loader/requirement/requirementloader');
        return RequirementLoader;
    };

    this.createMainLoader = function () {
        const MainLoader = require('./loader/mainloader');
        return MainLoader;
    };

    this.createTemplateBuildService = function () {
        const TemplateBuildService = require('./service/templatebuilderservice');
        return TemplateBuildService;
    };

    this.createDatabaseService = function () {
        const DatabaseService = require('./service/databaseservice');
        return DatabaseService;
    };

    this.createTemplateDaoService = function () {
        const DaoService = require('./service/templatedaoservice');
        return DaoService;
    };

    this.createRequirementDaoService = function () {
        const DaoService = require('./service/requirementdaoservice');
        return DaoService;
    };

    this.createJsonPathService = function () {
        const Service = require('./service/jsonpathservice');
        return Service;
    };

    this.destroy = function () {
        const dbService = this.getInstance("databaseService");
        return dbService.destroy();
    };

    const container = this.createContainer();
    this.registerServices(container);
    //container.compile();
    this.container = container;
}