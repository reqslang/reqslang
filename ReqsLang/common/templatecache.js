module.exports = TemplateCache;

/**
 * Template cache
 */
function TemplateCache() {

    /**
     * Table to represent cache for templates
     */
    this._cacheArray = [];

    /**
     * Creates template cache
     * @param {any} path Path to template
     * @param {any} templateObject Template object
     * @returns {any} template cache key
     */
    this._createTemplateEntry = function (path, templateObject) {
        const template = {
            path: this._correctPath(path),
            object: templateObject
        };

        return template;
    };


    //TODO consider if we have problem with resolving paths, current assumption: all paths will be local
    /**
     * Simplifies path (trims and lower case) to templates
     * @param {any} path Path to template
     * @returns {String} Simpliefied path
     */
    this._correctPath = function (path) {
        var nPath = new String(path) || "";
        nPath = nPath.trim().toLowerCase();
        if (nPath.length < 2) {
            throw "Requirements path must be greater than zero";
        }

        return nPath;
    };

    /**
     * Returns template object from cache
     * @param {String} path Path to template
     * @returns {any} Template object if found, otherwise unknown
     */
    this.getTemplate = function (path) {
        const nPath = this._correctPath(path);
        var result = undefined;

        this._cacheArray.forEach((current) => {
            if (current.path === nPath) {
                result = current.object;
            }
        });

        return result;
    };
    
    /**
     * Adds template to cache
     * @param {any} path Template path
     * @param {any} templateObject Template object to store in cache
     */
    this.addTemplate = function (path, templateObject) {
        const entry = this._createTemplateEntry(path, templateObject);
        const duplicateCheck = this.getTemplate(entry.path);

        if (!duplicateCheck) {
            this._cacheArray.push(entry);
        } else {
            throw "Requirements template already exists for given path: " + path;
        }
    };

    /**
     * @returns {Any} first object in the cache
    */
    this.first = function () {
        if (this._cacheArray.length < 1) {
            return undefined;
        } else {
            return this._cacheArray[0].object;
        }
    };

    /**
     * Exposes forEach function to iterate over cached objects
     * @param {Function} fn Callback function
     */
    this.forEach = function (fn) {
        this._cacheArray.map(el => el.object).forEach(fn);
    };

    /**
     * All keys registered in cache
     * @returns {Map} map with keys
     */
    this.allKeys = function () {
        return this._cacheArray.map(el => el.path);
    };
}