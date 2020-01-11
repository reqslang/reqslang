module.exports = FirstProjectLoader;

function FirstProjectLoader(logger, pathService) {
    this.pathService = pathService;

    const BaseLoader = require('./../baseloader');
    BaseLoader.call(this, logger);

    this.initFiles = function () {
        const resolvedFiles = {
            templates: undefined,
            requirements: undefined
        };
        return resolvedFiles;
    };

    this.initResult = function (projectAbsolutePath, resolvedFiles) {
        const result = {
            absolutePath: projectAbsolutePath,
            files: resolvedFiles
        };
        return result;
    };

    this.load = function (project) {
        return this.oWrapper((observer) => {
                const projectRelativePath = project.projectFileName;
                const projectAbsolutePath = this.pathService.resolveProjectPath(projectRelativePath);
                const projectAbsoluteDirPath = this.pathService.getDir(projectAbsolutePath);
                const resolvedFiles = this.initFiles();
                var groupsRead = 0;
                const itemGroup = project.projectJson.itemGroup;
                groupsRead += this.resolveTemplatePaths(projectAbsoluteDirPath, itemGroup, resolvedFiles);
                groupsRead += this.resolveRequirementsPaths(projectAbsoluteDirPath, itemGroup, resolvedFiles);
                this.assertNotEmptyProject(groupsRead, observer);
                const result = this.initResult(projectAbsolutePath, resolvedFiles);
                observer.next(result);
                observer.complete();
        });
    };

    this.resolveTemplatePaths = function (projectAbsoluteDirPath, itemGroup, resolvedFiles) {
        if (itemGroup.templates && itemGroup.templates.length) {
            resolvedFiles.templates = itemGroup.templates.map(template => this.relativetoAbsolutePath(projectAbsoluteDirPath, template.filePath));
            return resolvedFiles.templates.length;
        }

        return 0;
    };

    this.resolveRequirementsPaths = function (projectAbsoluteDirPath, itemGroup, resolvedFiles) {
        if (itemGroup.requirements && itemGroup.requirements.length) {
            resolvedFiles.requirements = itemGroup.requirements.map(requirement => this.relativetoAbsolutePath(projectAbsoluteDirPath, requirement.filePath));
            return resolvedFiles.requirements.length;
        }

        return 0;
    };

    this.assertNotEmptyProject = function (groupsRead, observer) {
        if (!groupsRead) {
            observer.error(new Error("Requirements project must contain either templates and/or requirements"));
        }
    };

    this.relativetoAbsolutePath = function (basePath, relativePath) {
        const absolutePath = pathService.resolvePaths(basePath, relativePath);
        return absolutePath;
    };
}