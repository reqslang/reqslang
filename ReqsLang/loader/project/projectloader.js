module.exports = ProjectLoader;

function ProjectLoader(logger, fileJsonService, fileSchemaValidationService, configService, pathService, templateLoader, requirementLoader, templatebuildservice, daoService) {
    const BaseLoader = require('./../baseloader');
    BaseLoader.call(this, logger);

    this.fileJsonService = fileJsonService;
    this.fileSchemaValidationService = fileSchemaValidationService;
    this.configService = configService;
    this.pathService = pathService;
    this.templateLoader = templateLoader;
    this.requirementLoader = requirementLoader;
    this.templatebuildservice = templatebuildservice;
    this.daoService = daoService;

    this.load = function (fileName) {
        return this.oWrapper((observer) => {
            this.fileJsonService.load(fileName)
                .flatMap(fileJson => this.projectFileJsonParsed(fileName, fileJson)
                    .flatMap(projectFileInformation => this.loadConfiguration(projectFileInformation))
                    .flatMap(projectFileInformation => this.mapConfigToVersion(projectFileInformation))
                    .flatMap(projectFileInformation => this.loadProjectSchema(projectFileInformation))
                    .flatMap(projectFileInformation => this.buildProjectStructure(projectFileInformation))
                    .flatMap(projectStructure => this.validateProjectStructure(projectStructure))
                    .flatMap(projectStructure => this.loadProject(projectStructure))
                    .flatMap(projectStructure => this.validateTemplates(projectStructure, observer))
                    .flatMap(projectStructure => this.processTemplates(projectStructure))
                    .flatMap(projectStructure => this.postProcessTemplates(projectStructure))
                    .flatMap(projectStructure => this.loadRequirements(projectStructure, observer))
            ).subscribe(result => {
                this.complete(result, observer);
            }, ex => observer.error(ex), () => observer.complete());
        });
    };

    this.projectFileJsonParsed = function (fileName, fileJson) {
        return this.oWrapper((o) => {
            this.logger.info("ProjectLoader Project is JSON file. Attempting to validate content of project file: " + fileName);
            if (fileJson.version) {
                this.logger.info("ProjectLoader Project file detected version: " + fileJson.version);
                const result = {
                    fileName: fileName,
                    fileJson: fileJson
                };
                o.next(result);
                o.complete();

            } else {
                o.error("ProjectLoader No version in project file: filename");
            }
        });
    };

    this.loadConfiguration = function (projectFileInformation) {
        return this.configService.getConfig()
            .map(config => {
                this.logger.info("ProjectLoader Configuration loaded");
                projectFileInformation.config = config;
                return projectFileInformation;
            });
    };

    this.mapConfigToVersion = function (projectFileInformation) {
        return this.oWrapper((o) => {
            this.logger.info("AProjectLoader ttempt to find configuration specific to the project version: " + projectFileInformation.fileJson.version);
            const configMapping = this.findConfigVersion(projectFileInformation.fileJson.version, projectFileInformation.config.validation.validatorMappings);
            if (configMapping) {
                projectFileInformation.configMapping = configMapping;
                o.next(projectFileInformation);
                o.complete();
            } else {
                o.error("ProjectLoader Version not supported" );
            }
        });
    };

    this.buildProjectStructure = function (projectFileInformation) {
        return this.oWrapper((o) => {
            const projectStructure = {
                project: {
                    projectFileName: projectFileInformation.fileName,
                    projectJson: projectFileInformation.fileJson,
                    projectSchemaPath: projectFileInformation.projectSchemaFilePath,
                    projectSchemaJson: projectFileInformation.projectSchema
                },
                configuration: {
                    configJson: projectFileInformation.config,
                    projectConfiguration: projectFileInformation.configMapping
                }
            };
            o.next(projectStructure);
            o.complete();
        });
    };

    this.loadProjectSchema = function (projectFileInformation) {
        const projectJson = projectFileInformation.fileJson;
        const configJson = projectFileInformation.config;
        const projectSchemaFilePath = this.pathService.resolvePath(pathService.cwd(), configJson.validation.schemaDirPath, projectJson.version, configJson.validation.projectSchemaFile);
        this.logger.info("ProjectLoader Attempting to load project file against schema in " + projectSchemaFilePath);
        return this.fileJsonService.load(projectSchemaFilePath).map(projectSchema => {
            projectFileInformation.projectSchema = projectSchema;
            projectFileInformation.projectSchemaFilePath = projectSchemaFilePath;
            return projectFileInformation;
        });
    };

    this.validateProjectStructure = function (projectStructure) {
        const projectJson = projectStructure.project.projectJson;
        const schemaJson = projectStructure.project.projectSchemaJson;
        return this.fileSchemaValidationService.validate(projectJson, schemaJson)
            .map(validationResult => {
                if (validationResult && validationResult.success) {
                    this.logger.info("ProjectLoader Project structure validated");
                    return projectStructure;                    
                }
                else {
                    throw validationResult.errorDescription;
                }
            });
    };

    this.loadProject = function (projectStructure) {
        this.logger.info("ProjectLoader Attempt to load project");
        const projectLoader = this.createProjectVersionLoader(projectStructure);
        return projectLoader.load(projectStructure.project).map(
            loadedProject => {
                projectStructure.project.loadedProject = loadedProject;
                return projectStructure;
            }
        );
    };

    this.validateTemplates = function (projectStructure, observer) {
        this.logger.info("ProjectLoader Attempt to validate tempaltes");
        return this.templateLoader.loadAndValidateTemplates(projectStructure, observer)
            .map(templateValidationResults => {
                    projectStructure.project.templates = templateValidationResults;
                    return projectStructure;
        });
    };

    this.processTemplates = function (projectStructure) {
        this.logger.info("ProjectLoader Attempt to process templates");
        const tc = this.templatebuildservice.buildTemplates(projectStructure.project.templates);
        projectStructure.project.templateCache = tc;
        return this.daoService.storeTemplates(tc).last().map(_ => {
            this.logger.info("ProjectLoader Templates stored in database");
            return projectStructure;
        });
    };

    this.postProcessTemplates = function (projectStructure) {
        this.logger.info("ProjectLoader Attempt to post-process templates");
        return this.daoService.getAllTemplates()
            .map(pairsWithIds => {
                const templates = projectStructure.project.templates;
                templates.forEach(t => {
                    const tPath = t.contentJson.id;
                    const tPair = pairsWithIds.find(pair => {
                        return pair.TemplateId.localeCompare(tPath) === 0;
                    });

                    t.database = {
                        id: tPair.Id
                    };
                });

                return projectStructure;
            });
    };

    //TODO collect validation failures
    this.loadRequirements = function (projectStructure, observer) {
        this.logger.info("ProjectLoader Attempt to load requirements");
        return this.requirementLoader.loadAndValidateRequirements(projectStructure, observer)
            .map(_ => projectStructure);
    };

    this.complete = function (projectStructure, observer) {
        //observer.next(projectStructure);
        observer.complete();
    };
    
    this.createProjectVersionLoader = function (projectStructure) {
        const loaderPath = this.getPathForProjectVersionLoader(projectStructure);
        const ProjectLoader = require(loaderPath);
        const projectLoader = new ProjectLoader(this.logger, this.pathService);
        return projectLoader;
    };

    this.getPathForProjectVersionLoader = function (projectStructure) {
        const projectConfig = projectStructure.configuration.projectConfiguration;
        return projectConfig.projectValidator;
    };

    this.findConfigVersion = function (projectVersion, validationConfigs) {
        const versionToCheck = projectVersion;
        const findReducer = (result, currentValue) => {
            if (result) {
                return result;
            }

            if (versionToCheck === currentValue.version) {
                return currentValue;
            }

            return result;
        };

        const configFound = validationConfigs.reduce(findReducer, undefined);
        return configFound;
    };
}