module.exports = JsonPathService;

/**
 * Evaluates JSON Path
 */
function JsonPathService() {
    const JSONPath = require("jsonpath");

    /**
     * Function that evaulates path for given document
     * @param {JSON} document JSON document
     * @param {String} jsonPath JSON Path query
     * @returns {Object} zero, one or more matching elements
     */
    this.queryPath = function (document, jsonPath) {
        var result = JSONPath.query(document, jsonPath);
        return result;
    };
}
