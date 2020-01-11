module.exports = RequirementLoader;

function RequirementLoader(logger, configService, pathService, fileMarkService, jsonPathService, schemaValidationService, requirementDaoService) {
    const Rx = require('rxjs/Rx');
    const RxOp = require('rxjs/operators');
    const iif = require("rxjs").iif;

    const ValidationFailure = require('./../../shared').ValidationFail;
    const ErrorCodes = require('./../../shared').ErrorCodes;

    const BaseLoader = require('./../baseloader');
    BaseLoader.call(this, logger);

    this.configService = configService;
    this.pathService = pathService;
    this.fileMarkService = fileMarkService;
    this.jsonPathService = jsonPathService;
    this.schemaValidationService = schemaValidationService;
    this.requirementDaoService = requirementDaoService;
    
    this.loadAndValidateRequirements = function (projectStructure, observer) {
        return this.loadRequirements(projectStructure, observer);
    };

    this.loadRequirements = function (projectStructure, observer) {
        const requirements = projectStructure.project.loadedProject.files.requirements;
        const requirementLoaders = requirements.map(requirement => this.loadRequirement(requirement));
        const mergedLoaders = Rx.Observable.merge.apply(null, requirementLoaders);
        return mergedLoaders
            .flatMap(reqParsed => this.parseRequirementDocument(reqParsed, observer))
            .flatMap(reqParsedTreeObject => this.mapRequirementToTemplate(reqParsedTreeObject, projectStructure, observer))
            .flatMap(reqParsedTreeObject => this.convertRequirement(reqParsedTreeObject, projectStructure, observer))
            .flatMap(reqParsedTreeObject => this.verifyRequirement(reqParsedTreeObject, projectStructure, observer))
            .scan((acc, value) => {
                acc.push(value);
                return acc;
            }, [])
            .last()
            .flatMap(requirementsArray => this.storeRequirements(requirementsArray, projectStructure, observer))
            .flatMap(projectStructure => this.storeLinks(projectStructure))
            .flatMap(projectStructure => this.showDatabaseContent(projectStructure))
            .flatMap(projectStructure => this.validateReqiurements(projectStructure, observer));
    };

    this.completeRequirementsProcessing = function (projectStructure, observer) {
        this.logger.info("RequirementLoader Requirements processing completed");
        observer.complete();
    };

    this.parseRequirementDocument = function (requirement, observer) {
        this.logger.info("RequirementLoader Parsing document: " + requirement.path);
        const reqDocTree = this.convertDocumentToTree(requirement.content);
        const allLinks = this.extractLinks(reqDocTree);
        this.assertAtLeastTwoLinksInRequirement(allLinks, requirement, observer);
        const templateLink = allLinks[0];
        const templatePath = templateLink.destination;
        const artefactIdLink = allLinks[1];
        const artefactIdPath = artefactIdLink.destination;
        this.assertTemplatePath(templatePath, requirement, observer);
        allLinks.splice(0, 2);
        const result = {
            artefactIdPath: artefactIdPath,
            requirementPath: requirement.path,
            documentTree: reqDocTree,
            templatePath: templatePath,
            effectiveLinks: allLinks
        };
        return Rx.Observable.of(result);
    };

    this.mapRequirementToTemplate = function (reqParsedTreeObject, projectStructure, observer) {
        this.logger.info("RequirementLoader Mapping requirement to template: " + reqParsedTreeObject.path);
        const template = projectStructure.project.templateCache.getTemplate(reqParsedTreeObject.templatePath);

        if (!template) {
            observer.next(new ValidationFailure(ErrorCodes.E_TEMPLATE_NOT_FOUND, "Requirement Remplate path not found: " + reqParsedTreeObject.templatePath, reqParsedTreeObject.path));
            o.next(reqParsedTreeObject);
            o.complete();
        }

        reqParsedTreeObject.template = template;
        return Rx.Observable.of(reqParsedTreeObject);
    };

    this.convertRequirement = function (reqParsedTreeObject, projectStructure, observer) {
        const requirementPath = reqParsedTreeObject.requirementPath;
        const template = reqParsedTreeObject.template;
        const documentTree = reqParsedTreeObject.documentTree;
        this.logger.info("RequirementLoader Converting document: " + requirementPath);
        const convertedRequirement = {
            artefactType: reqParsedTreeObject.templatePath,
            artefactId: reqParsedTreeObject.artefactIdPath
        };
        const convRules = template.getConversionRules();
        convRules.forEach(convRule => {
            const value = this.convertField(documentTree, convRule, requirementPath, observer);
            convertedRequirement[convRule.field.trim()] = value;
        });
        reqParsedTreeObject.convertedRequirement = convertedRequirement;
        return Rx.Observable.of(reqParsedTreeObject);
    };

    /**
     * 
     * TODO fix it with return tupes
     * @param {any} reqParsedTreeObject Parsed requirement object
     * @param {any} projectStructure Project reference
     * @param {any} observer Observer for verification issues
     * @returns {Rx.Observable} observable
     */
    this.verifyRequirement = function (reqParsedTreeObject, projectStructure, observer) {
        this.logger.info("RequirementLoader Verifying document: " + reqParsedTreeObject.requirementPath);
        const reqDocStructure = reqParsedTreeObject.convertedRequirement;
        const template = reqParsedTreeObject.template;
        const requirementPath = reqParsedTreeObject.requirementPath;

        return this.schemaValidationService.validate(reqDocStructure, template.getVerificationRules(), requirementPath)
            .map(result => {
                if (!result.success) {
                    observer.next(result);
                }

                reqParsedTreeObject.verificationSucces = result.success;
                return reqParsedTreeObject;
            });
    };

    this.convertField = function (documentTree, convRule, requirementPath, observer) {
        try {
            const value = this.jsonPathService.queryPath(documentTree, convRule.path);

            if (value.length < 1) {
                throw "value not found";
            }

            return value[0];
        } catch (ex) {
            observer.next(new ValidationFailure(ErrorCodes.E_REQUIREMENT_CONVERT_FAILURE, "Requirements field not meeting criteria for field: '" + convRule.field + "', error: " + ex, requirementPath));
            return undefined;
        }
    };

    this.assertTemplatePath = function (templatePath, requirement, observer) {
        var nPath = new String(templatePath);
        nPath = nPath.trim();
        if (nPath.length < 2) {
            observer.next(new ValidationFailure(ErrorCodes.E_LINK_TOO_SHORT, "Requirements template path must be greater than zero", requirement.path));
        }
    };

    this.assertAtLeastTwoLinksInRequirement = function (allLinks, requirement, observer) {
        if (!allLinks || allLinks.length < 2) {
            observer.next(new ValidationFailure(ErrorCodes.E_DOCUMENT_MUST_HAVE_AT_LEAST_TWO_LINKS, "Document must have at least two links, first must be template", requirement.path));
        }
    };

    this.convertDocumentToTree = function (requirementParsed) {
        function buildElement(node) {
            var element = {
                type: node.type,
                children: [],
                sourcepos: node.sourcepos,
                literal: node.literal,
                destination: node.destination,
                title: node.title,
                info: node.info,
                level: node.level,
                listType: node.listType,
                listTight: node.listTight,
                listStart: node.listStart,
                listDelimiter: node.listDelimiter
            };

            if (node.isContainer) {
                var childNode = node.firstChild;
                while ((childNode) !== null) {
                    var childElement = buildElement(childNode);
                    element.children.push(childElement);
                    childNode = childNode.next;
                }
            }

            return element;
        }

        const docTree = buildElement(requirementParsed);
        return docTree;
    };

    this.extractLinks = function (requirement) {
        const linksPath = "$..[?(@.type === 'link')]";
        const allLinks = this.jsonPathService.queryPath(requirement, linksPath);
        const processedLinks = allLinks.map(
            rawLink => {
                const destination = rawLink.destination;
                const labelCombined = rawLink.children
                    .filter(c => c.type === 'text')
                    .map(t => {
                        return t.literal;
                    })
                    .join(' ');

                return {
                    destination: destination,
                    label: labelCombined
                };
            });

        return processedLinks;
    };

    this.loadRequirement = function (requirementFilePath) {
        this.logger.info("RequirementLoader Attempt to load file: " + requirementFilePath);
        return this.fileMarkService.load(requirementFilePath).map(content => {
            this.logger.info("RequirementLoader Loaded file: " + requirementFilePath);
            const result = {
                path: requirementFilePath,
                content: content
            };
            return result;
        });
    };

    this.storeRequirements = function (reqParsedTreeObjects, projectStructure, observer) {
        this.logger.info("RequirementLoader Attempt to store artifacts in db");
        const templates = projectStructure.project.templates;

        const dbObjects = reqParsedTreeObjects.map(reqParsedTreeObject => {
            const templatePath = reqParsedTreeObject.templatePath.trim();
            const template = templates.find(t => t.contentJson.id.trim().localeCompare(templatePath) === 0);
            const templateId = template.database.id;
            const artefactIdPath = reqParsedTreeObject.artefactIdPath;
            const result = {
                templateId: templateId,
                artefactIdPath: artefactIdPath
            };
            return result;
        });

        return this.requirementDaoService.storeRequirements(dbObjects).map(_ => {
            projectStructure.project.requirements = this.mapTreeObjectsToDatabaseIds(reqParsedTreeObjects, templates);
            return projectStructure;
        });
    };

    this.showDatabaseContent = function (projectStructure) {
        const showDb = projectStructure.configuration
            && projectStructure.configuration.configJson
            && projectStructure.configuration.configJson.programArgs
            && projectStructure.configuration.configJson.programArgs.showDatabase;

        return iif(() => showDb,
            this.requirementDaoService.selectAllFromDatabase()
                .do(dbContent => {
                    this.logger.log("RequirementLoader Content of database:");
                    this.logger.log(dbContent);
                    return projectStructure;
                }),
            Rx.Observable.of(projectStructure)
        ).map(_ => projectStructure);
    };

    this.mapTreeObjectsToDatabaseIds = function (reqParsedTreeObjects, templates) {
        return reqParsedTreeObjects.map(req => {
            const template = templates.find(t => t.contentJson.id.trim().localeCompare(req.templatePath.trim()) === 0);
            const newReq = {
                artefactIdPath: req.artefactIdPath,
                convertedRequirement: req.convertedRequirement,
                effectiveLinks: req.effectiveLinks,
                requirementPath: req.requirementPath,
                template: template
            };

            return newReq;
        });
    };

    this.storeLinks = function (projectStructure) {
        this.logger.info("RequirementLoader Attempt to store artifact links in db");
        return this.requirementDaoService.getAllRequirements().flatMap(dbPairs => {
            const requirements = projectStructure.project.requirements;
            requirements.forEach(r => {
                r.database = {
                    Id: dbPairs.find(pair => pair.ArtifactId.localeCompare(r.artefactIdPath) === 0).Id
                };
            });
            const trimLinkLabel = (label) => label ? label.length > 255 ? label.substring(0, 255) : label : null;
            const links = [];
            requirements.forEach(r => {
                const sourceArtifactId = r.database.Id;
                r.effectiveLinks.forEach(link => {
                    const linkdestination = link.destination;
                    const targetRequirement = requirements.find(tr => tr.artefactIdPath.localeCompare(linkdestination) === 0);

                    if (targetRequirement && targetRequirement.database) {
                        links.push({
                            SourceArtifactId: sourceArtifactId,
                            DestinationArtifactId: targetRequirement.database.Id,
                            FieldName: trimLinkLabel(link.label)
                        });
                    }

                });
            });

            return this.requirementDaoService.storeRequirementsLinks(links).flatMap(_ => {
                return Rx.Observable.of(projectStructure);
            });
        });
    };

    this.validateReqiurements = function (projectStructure, observer) {
        this.logger.info("RequirementLoader Attempt to validate requirements in database");
        const requirements = Rx.Observable.from(projectStructure.project.requirements);
        return requirements.flatMap(requirement => {
            if (!(requirement.template.contentJson
                && requirement.template.contentJson.validationRules
                && requirement.template.contentJson.validationRules.length > 0)) {
                return Rx.Observable.of(true);
            }

            return Rx.Observable.from(requirement.template.contentJson.validationRules)
                .pipe(
                    RxOp.map(rule => {
                    const ruleQuery = rule.query;
                    const ruleName = rule.name;
                    this.logger.info("RequirementLoader Attempt to validate requirement '"
                        + requirement.artefactIdPath
                        + "' with rule '"
                        + ruleName
                        + "'");
                    return this.requirementDaoService.validateRule(ruleQuery, requirement)
                        .map(c => {
                            if (c && c.length > 0 && c[0].count < 1) {
                                observer.next(new ValidationFailure(ErrorCodes.E_REQUIREMENT_VALIDATION_FAUILURE, ruleName, requirement.artefactIdPath));
                            }

                            return true;
                        });
                    }),
                    RxOp.combineAll()
                ).last();
        }).last()
            .map(_ => {
                return projectStructure;
            });
    };
}