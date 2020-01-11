module.exports = TemplateLoader;

function TemplateLoader(logger, fileJsonService, fileSchemaValidationService, configService, pathService) {
    const Rx = require('rxjs/Rx');

    const BaseLoader = require('./../baseloader');
    BaseLoader.call(this, logger);

    this.fileJsonService = fileJsonService;
    this.fileSchemaValidationService = fileSchemaValidationService;
    this.configService = configService;
    this.pathService = pathService;

    this.loadAndValidateTemplates = function (projectStructure, observer) {
        return this.loadTemplateSchemaJsonFile(projectStructure)
            .flatMap(templateProjectStructure => this.loadAndValdateTemplates(templateProjectStructure.templateSchema, templateProjectStructure.projectStructure, observer));
    };

    this.loadTemplateSchemaJsonFile = function (projectStructure) {
        const templates = this.pathService.resolvePath(this.pathService.cwd(), projectStructure.configuration.configJson.validation.schemaDirPath, projectStructure.project.projectJson.version, projectStructure.configuration.configJson.validation.templateSchemaFile);
        this.logger.info("TemplateLoader Attempting to load template file against schema in " + templates);
        return this.fileJsonService.load(templates)
            .map(templateSchema => {
                return {
                    templateSchema: templateSchema,
                    projectStructure: projectStructure
                };
            });
    };

    this.loadAndValdateTemplates = function (templateSchema, projectStructure, observer) {
        const ts = templateSchema;
        const templateFilePaths = projectStructure.project.loadedProject.files.templates;
        const validationResults = [];
        return Rx.Observable.from(templateFilePaths)
            .flatMap(templateFilePath => this.loadAndValidateTemplate(templateFilePath, ts))
            .flatMap(vr => {
                if (vr.validationResult && vr.validationResult.success) {
                    validationResults.push(vr);
                } else {
                    observer.next(vr.validationResult);
                }
                return Rx.Observable.of(vr);
            }).last().map(_ => validationResults);
    };

    this.loadAndValidateTemplate = function (templateFilePath, templateSchema) {
        return this.fileJsonService.load(templateFilePath)
            .flatMap(templateJson => this.validateTemplate(templateFilePath, templateSchema, templateJson));
    };

    this.validateTemplate = function (templateFilePath, templateSchema, templateJson) {
        return this.fileSchemaValidationService.validate(templateJson, templateSchema, templateFilePath)
            .map(templateValidationResult => {
                const result = {
                    filePath: templateFilePath,
                    contentJson: templateJson,
                    validationResult: templateValidationResult
                };
                return result;
            });
    };
}