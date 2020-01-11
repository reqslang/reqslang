module.exports = TemplateBuildService;

/**
 * Service to check basic constraints and build runtime template structures from defined structures in json files
 */
function TemplateBuildService() {
    const TemplateCache = require('./../common/templatecache');
    const Template = require('./../common/template');
    /**
     * Build and cachces templates
     * 
     * @param {Array} templateValidationResults JSON structure of templates loaded from files
     * @returns {TemplateCache} Template cache with runtime templates resolved
     */
    this.buildTemplates = function (templateValidationResults) {
        const vtc = new TemplateCache();
        const rtc = new TemplateCache();
        templateValidationResults.forEach(templateStructure => vtc.addTemplate(templateStructure.contentJson.id, templateStructure.contentJson));
        const splitTc = this.checkExistanceOfAllBaseArtifactsAndSplit(vtc);
        const loopCheck = this.checkForLoopInBaseChain(vtc);
        this.throwOnLoop(loopCheck);
        this.buildTemplatesWithoutBase(splitTc.withoutBase, rtc);
        this.buildTemplatesWithBase(splitTc.withBase, rtc);
        return rtc;
    };

    /**
     * Checks value of result, if true then trows an exception with message of source and destination ids
     * @param {LoopResult} loopCheck Structure to check
     */
    this.throwOnLoop = function (loopCheck) {
        if (loopCheck.result) {
            throw "Template base loop detected between: '" + loopCheck.source.id + "' and '" + loopCheck.destination.id + "'";
        }
    };

    /**
     * Holds loop result
     * @param {Boolean} result Boolean result
     * @param {any} source Source template object
     * @param {any} destination Destination template object
     * @returns {any} structure of elements passed into
     */
    this.LoopResult = function (result, source, destination) {
        return {
            result: result,
            source: source,
            destination: destination
        };
    };

    /**
     * Checks for Loops in the linked list of artifacts and base artifacts
     * Floyd's algorithm as in https://en.wikipedia.org/wiki/Cycle_detection
     * @param {TemplateCache} templateCache Templates Structure Cache
     * @returns {LoopResult} Structure with results
     */
    this.checkForLoopInBaseChain = function (templateCache) {
        
        function getNextBaseElement(el) {
            if (el) {
                return templateCache.getTemplate(el.base);
            }

            return undefined;
        }

        let tortoise = templateCache.first();
        let hare = templateCache.first();
        
        while (hare && getNextBaseElement(hare)) {
            tortoise = getNextBaseElement(tortoise);
            hare = getNextBaseElement(getNextBaseElement(hare));

            if (tortoise === hare && tortoise && hare) {
                return this.LoopResult(true, tortoise, hare);
            }
        }

        return this.LoopResult(false);
    };

    /**
     * Constructs the template from its structure
     * @param {any} templateStructure Structure of the element
     * @returns {Template} Template constructed
     */
    this.buildTemplate = function (templateStructure) {
        return new Template(templateStructure);
    };

    /**
     * Builds runtime template objects for all templates structures without base
     * @param {any} vtc collection of template objects
     * @param {templateCache} rtc template cache for runtime objects
     */
    this.buildTemplatesWithoutBase = function (vtc, rtc) {
        vtc.forEach(tvr => {
            const template = this.buildTemplate(tvr);
            rtc.addTemplate(tvr.id, template);
        });
    };

    /**
     * Builds runtime template objects for single templates structure with base (goes through the tree)
     * @param {any} tvr templte structure to build runtime template for it
     * @param {templateCache} rtc template cache for runtime objects
     * @returns {any} runtime template representation
     */
    this.buildTemplateWithBase = function (tvr, rtc) {
        const alreadyResolvedTemplate = rtc.getTemplate(tvr.id);

        if (alreadyResolvedTemplate) {
            return alreadyResolvedTemplate;
        }

        const template = this.buildTemplate(tvr);
        const alreadyResolvedBaseTemplate = rtc.getTemplate(tvr.base);

        if (alreadyResolvedBaseTemplate) {
            template.baseTemplate = alreadyResolvedBaseTemplate;
        } else {
            const newBaseTemplate = this.buildTemplateWithBase(tvr, rtc);
            template.baseTemplate = newBaseTemplate;
        }

        rtc.addTemplate(tvr.id, template);
        return template;
    };

    /**
     * Builds runtime template objects for all templates structures with base (goes through the tree)
     * @param {any} vtc collection of template objects
     * @param {any} rtc template cache for runtime objects
     */
    this.buildTemplatesWithBase = function (vtc, rtc) {
        vtc.forEach(tvr => this.buildTemplateWithBase(tvr, rtc));
    };

    /**
     * Checks if base is valid text to be used as a base pointer
     * @param {String} base base path from the template structure
     * @returns {Boolean} true if base is valid, non empty string
     */
    this.checkBase = function (base) {
        if (base === undefined) {
            return false;
        }

        const result = new String(base).trim().length > 0;
        return result;
    };

    /**
     * Goes through all templates in cache and checks if all base artifacts are also defined.
     * If there is a templte with unknown base template, then throws an exception
     * @param {templateCache} templateCache collection with artifacts.
     * @returns {any} an object with two arrays of templates (withBase and withoutBase)
     */
    this.checkExistanceOfAllBaseArtifactsAndSplit = function (templateCache) {        
        const withoutBase = [];
        const withBase = [];

        templateCache.forEach(vReq => {
            const vBase = vReq.base;

            if (this.checkBase(vBase)) {
                baseTemplate = templateCache.getTemplate(vBase);

                if (!baseTemplate) {
                    throw "Base template doesn't exist for template with id: " + vReq.id;
                }

                withBase.push(vReq);
            } else {
                withoutBase.push(vReq);
            }
        });

        return {
            withBase: withBase,
            withoutBase: withoutBase
        };
    };
}
