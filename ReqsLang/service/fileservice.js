module.exports = FileService;

/**
 * File reader service for node env
 */
function FileService() {

    const oFn = require("./../common/ofn");
    oFn.call(this);

    const fs = require('fs');
    const encoding = 'utf8';

    /**
     * Reads file into memory, be careful with big files
     * @param {any} fileName Filename
     * @returns {Observable} Observable with result
     */
    this.readFile = function (fileName) {
        return this.oWrapper((observer) => {
            fs.readFile(fileName, encoding, function (err, contents) {
                if (err) {
                    observer.error(err);
                } else {
                    observer.next(contents);
                    observer.complete();
                }
            });
        });  
    };

    /**
     * Writes file to the memory
     * @param {any} fileName Filename
     * @param {any} content File content
     * @returns {Observable} Observable with result
     */
    this.writeFile = function (fileName, content) {
        return this.oWrapper((observer) => {
            fs.writeFile(fileName, content, function (err, content) {
                if (err) {
                    observer.error(err);
                } else {
                    observer.next(true);
                    observer.complete();
                }
            });
        });
    };
}