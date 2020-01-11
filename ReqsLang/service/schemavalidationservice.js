module.exports = SchemaValidationService;

/**
 * JS Schema validation service for JSON files
 * @param {any} logger Logger to log messages
 */
function SchemaValidationService(logger) {

    // todo add ajv validation
    this.logger = logger;

    const oFn = require("./../common/ofn");
    oFn.call(this);

    const Ajv = require('ajv');
    const ValidationSuccess = require('./../shared').ValidationSuccess;
    const ValidationFail = require('./../shared').ValidationFail;
    const ErrorCodes = require('./../shared').ErrorCodes;

    /**
    * Validation of given @param fileJson with given JSON schema in @param schemaJson
    * @param {Object} json JSON content to be validated in terms of structure
    * @param {Object} schemaJson JSON schema used to validate
    * @param {String} filename file name currently processed
    * @return {Observable} observable to subscribe for validation result
    */
    this.validate = function (json, schemaJson, filename) {
        return this.ofWrapper((observer) => {            
            const ajv = this.createAjv(); // options can be passed, e.g. {allErrors: true}
            this.info("Ajv created for validation of " + (filename || ""));
            const validator = ajv.compile(schemaJson);
            this.info("Ajv compiled for given schemaJson");
            const valid = validator(json);
            this.info(" Validator finished, processing result");

            if (valid) {
                this.info("File is valid " + (filename || ""));
                observer.next(new ValidationSuccess());
            }
            else {
                this.info("File is invalid " + (filename || ""));
                const errorsMsg = this.mapValidationErrors(validator.errors);
                observer.next(new ValidationFail(ErrorCodes.E_PROJECT_VALIDATION_FAIL, errorsMsg));
            }
        });
    };

    // TODO localize
    this.errorMsg = function (message) {
        return "Schema validation error: \"" + message + "\"";
    };

    // TODO localize
    this.newLine = function () {
        return "\r\n";
    };

    this.mapValidationErrors = function (errors) {
        return errors
            .map(error => this.errorMsg(error.message))
            .join(this.newLine());
    };

    this.createAjv = function () {
        const ajv = new Ajv(); 
        return ajv;
    };

    this.info = function (msg) {
        this.logger.info("SchemaValidationService " + msg);
    };
}