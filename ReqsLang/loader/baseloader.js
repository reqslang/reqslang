module.exports = BaseLoader;

/**
 * Base loader for all loaders
 * 
 * @param {any} logger Logger for logging
 */
function BaseLoader(logger) {
    this.logger = logger;
    const oFn = require("./../common/ofn");
    oFn.call(this);
}