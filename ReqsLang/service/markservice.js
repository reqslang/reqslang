module.exports = MarkService;

/**
 * Markdown parser service
 */
function MarkService() {
    const oFn = require("./../common/ofn");
    oFn.call(this);
    const commonmark = require('commonmark');
    const reader = new commonmark.Parser();
    this.reader = reader;

    this.parse = function (text) {
        return this.oWrapper((observer) => {
            const parsed = this.reader.parse(text);
            observer.next(parsed);
            observer.complete();
        });
    };
}