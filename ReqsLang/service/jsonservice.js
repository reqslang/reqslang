module.exports = JsonService;

/**
 * Simple JSON parser service
 */
function JsonService() {

    const oFn = require("./../common/ofn");
    oFn.call(this);

    this.parse = function (text) {
        return this.oWrapper((observer) => {
                const jsonResult = JSON.parse(text);
                observer.next(jsonResult);
                observer.complete();
        });
    };
}