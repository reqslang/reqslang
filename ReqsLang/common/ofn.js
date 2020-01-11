module.exports = oFn;

/**
 * Base for all observable functions
 */
function oFn() {
    const Rx = require('rxjs/Rx');

    /**
     * Creates observable and executes function in parameter and wraps with try... catch
     * 
     * @param {Function} fn Function to execute within observable
     * @returns {Rx.Observable} Observable
     */
    this.oWrapper = function (fn) {
        return Rx.Observable.create((observer) => {
            try {
                fn(observer);
            }
            catch (err) {
                this.errorHandler(err, observer);
            }
        });
    };

    /**
     * Creates observable and executes function in parameter and wraps with try... catch... finally
     *
     * @param {Function} fn Function to execute within observable
     * @returns {Rx.Observable} Observable
     */
    this.ofWrapper = function (fn) {
        return Rx.Observable.create((observer) => {
            try {
                fn(observer);
            }
            catch (err) {
                this.errorHandler(err, observer);
            }
            finally {
                observer.complete();
            }
        });
    };

    /**
     * Generic exception/error handler for observables
     * 
     * @param {any} ex Exception to be raised on observer
     * @param {Rx.observer} observer Observer to raise an error
     */
    this.errorHandler = function (ex, observer) {
        observer.error(ex);
    };
}