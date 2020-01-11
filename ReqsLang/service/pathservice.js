module.exports = PathService;

/**
 * Resolves paths on node env
 */
function PathService() {
    const path = require('path');

    this.getDir = function (projectPath) {
        const projectDir = path.dirname(projectPath);
        return projectDir;
    };

    this.resolvePath = function (initialPath, folderPath, version, filePath) {
        return path.resolve(initialPath, folderPath, version, filePath);
    };

    this.resolveProjectPath = function (filePath) {
        return path.resolve(filePath);
    };

    this.resolvePaths = function (basePath, nextFile) {
        return path.resolve(basePath, nextFile);
    };

    this.cwd = function () {
        return process.cwd();
    };
};