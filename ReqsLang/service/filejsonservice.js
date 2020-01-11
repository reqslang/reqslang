module.exports = FileJsonService;

/**
 * Strategy service that encapsulates reading files from file service and parsing it to the JSON structure
 * @param {any} fileService file serive to read files
 * @param {any} jsonService json service to parse content to JSON structure
 * @param {any} logger logger to log comments
 */
function FileJsonService(fileService, jsonService, logger) {

    const oFn = require("./../common/ofn");
    oFn.call(this);

    this.fileService = fileService;
    this.jsonService = jsonService;

    /**
     * Loads a file and returns observable for JSON structure
     * @param {any} fileName filename
     * @returns {any} observable for JSON structure
     */
    this.load = function (fileName) {
        return this.oWrapper((observer) => {     
            this.fileService.readFile(fileName)
                .subscribe((fs) =>  this.projectFileLoaded(fs, observer), (ex) => this.onError(ex, observer));
        });
    };

    this.onError = function (ex, observer) {
        logger.info("FileJsonService.onError" + ex);
        this.errorHandler(ex, observer);
    };

    this.projectFileLoaded = function (fileContent, observer) {
        this.jsonService.parse(fileContent)
            .subscribe(result => this.projectFileJsonParsed(result, observer), ex => this.onError(ex, observer));
    };

    this.projectFileJsonParsed = function (fileJson, observer) {
            observer.next(fileJson);
            observer.complete();
    };
}
