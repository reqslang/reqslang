

/**
* Enum for error codes
*/
const ErrorCodes =  Object.freeze({
    /**
    * Validation step succeeded
    */
    E_OK: 0,
    /**
    * Generic error (i.e. system error)
    */
    E_GENERIC_FAIL: 1,
    /**
     * Project validation fail
     */
    E_PROJECT_VALIDATION_FAIL: 2,
    /*
     * Document must have at least two links (one for template id second for requirement id)
     */
    E_DOCUMENT_MUST_HAVE_AT_LEAST_TWO_LINKS: 4,
    /*
     * Given link is too short
     */
    E_LINK_TOO_SHORT: 8,
    /*
     * Template not found
     */
    E_TEMPLATE_NOT_FOUND: 16,
    /*
     * Error when conversion fails for given field 
     */
    E_REQUIREMENT_CONVERT_FAILURE: 32,
    /*
     * Error when validation rule fails for given artefact
     */
    E_REQUIREMENT_VALIDATION_FAUILURE: 64
});

/**
* Object for validation results
* @param {ErrorCodes} errorCode is error code see @ErrorCodes
* @param {String} errorDescription is user friendly description of an error
* @param {String} filePath path to processed file
*/
function ValidationResult(errorCode, errorDescription, filePath) {
    this.success = ErrorCodes.E_OK === errorCode;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
    this.filePath = filePath;

    this.toError = function () {
        return new Error("'" + this.errorCode + "' :" + "'" + this.errorDescription + "'");
    };
}

/**
* Object for valiation success
* @returns {ValidationResult} Newly created  Object
*/
function ValidationSuccess() {
    ValidationResult.call(this, ErrorCodes.E_OK, "", "");
    return this;
}

/**
* Object for validation failures
* @param {any} errorCode is error code see @ErrorCodes
* @param {String} errorDescription is user friendly description of an error
* @param {String} filePath path to processed file
* @returns {ValidationResult} Newly created  Object
*/
function ValidationFail(errorCode, errorDescription, filePath) {
    ValidationResult.call(this, errorCode, errorDescription, filePath);
    return this;
}

module.exports.ValidationResult = ValidationResult;
module.exports.ValidationSuccess = ValidationSuccess;
module.exports.ValidationFail = ValidationFail;
module.exports.ErrorCodes = ErrorCodes;