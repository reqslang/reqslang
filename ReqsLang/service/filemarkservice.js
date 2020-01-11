module.exports = FileMarkService;

const FileService = require('./filejsonservice');
const MarkService = require('./markservice');

/**
 * Strategy service that encapsulates reading files from file service and parsing it to the Markdown structure
 * @param {FileService} fileService file serive to read files
 * @param {MarkService} markService json service to parse content to JSON structure
 * @param {any} logger logger to log comments
 */
function FileMarkService(fileService, markService, logger) {

    const oFn = require("./../common/ofn");
    oFn.call(this);

    this.fileService = fileService;
    this.markService = markService;

    /**
     * Loads a file and returns observable for Markdown structure
     * @param {any} fileName filename
     * @returns {any} observable for Markdown structure
     */
    this.load = function (fileName) {
        return this.oWrapper((observer) => {
            this.fileService.readFile(fileName)
                .subscribe((fs) => this.projectFileLoaded(fs, observer), (ex) => this.onError(ex, observer));
        });
    };

    this.onError = function (ex, observer) {
        logger.info("FileJsonService.onError" + ex);
        this.errorHandler(ex, observer);
    };

    this.projectFileLoaded = function (fileContent, observer) {
        this.markService.parse(fileContent)
            .subscribe(result => this.projectFileParsed(result, observer), ex => this.onError(ex, observer));
    };

    this.projectFileParsed = function (fileJson, observer) {
        observer.next(fileJson);
        observer.complete();
    };
}
