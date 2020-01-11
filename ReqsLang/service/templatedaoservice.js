module.exports = TemplateDaoService;

const DatabaseService = require("./databaseservice");
const TemplateCache = require("../common/templatecache");
const Observable = require("rxjs").Observable;
const defer = require("rxjs").defer;
const mergeAll = require("rxjs/operators").mergeAll;

/**
 * Data Access Object Service for templates
 * @param {any} logger Logger
 * @param {DatabaseService} databaseService Database service to store and query elements
 */
function TemplateDaoService(logger, databaseService) {
    const oFn = require("../common/ofn");
    oFn.call(this);
    this.logger = logger;
    this.databaseService = databaseService;

    /**
     * Stores templates
     * 
     * Internally it uses defer and mergeAll(1) to make database manipulation queries in desired sequence (locks aren't needed)
     * @param {TemplateCache} tc Template cache
     * @returns {Observable} observable with templates
     */
    this.storeTemplates = function (tc) {
        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();
                const templates = tc.allKeys()
                    .map(tid => tc.getTemplate(tid));
                const templatesObservableArray = templates.map(template => defer(() => this._newStoreTemplate(context, dbc, template)));

                return Observable.from(templatesObservableArray)
                    .pipe(mergeAll(1));
            });
    };

    /**
     * Selects all artifact templates from databases (path under TemplateId and Database identifier under Id) 
     * @returns {Observable} Observable for collection
     */
    this.getAllTemplates = function () {
        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();

                return Observable.fromPromise(context(dbc.ArtifactTemplates)
                    .select(dbc.Id, dbc.TemplateId));
            });
    };

    /**
     * Stores when tempalte absent in database, selects its id when present
     * @param {any} context Database Context
     * @param {any} dbc Database Constants
     * @param {any} template Template to be be stored
     * @returns {Observable} Observable for template id
     */
    this._newStoreTemplate = function (context, dbc, template) {
        const processDbResults = (dbResult, valueSelector) => {
            if (dbResult && dbResult.length && dbResult.length > 0) {
                return parseInt(valueSelector(dbResult[0]), 10);
            }

            return 0;
        };

        const insertSelectItemObservable = (templateId, isAbstract, baseTemplateId) =>
            Observable.fromPromise(
                context(dbc.ArtifactTemplates)
                    .where(dbc.TemplateId, templateId)
                    .select(dbc.Id))
                .flatMap(dbResult => {
                    var id = processDbResults(dbResult, s => s.Id);

                    return id > 0 ?
                        Observable.of(id)
                        : Observable.fromPromise(
                            context(dbc.ArtifactTemplates)
                                .insert({
                                    IsAbstract: isAbstract || false,
                                    TemplateId: templateId,
                                    BaseId: baseTemplateId
                                }))
                            .flatMap(insertDbResult => {
                                id = processDbResults(insertDbResult, n => n);

                                return id > 0 ?
                                    Observable.of(id)
                                    : Observable.throwError("Cannot insert to the database: " + templateId);
                            });
                });

        return this.buildAndConnectDatabaseObservables(template, insertSelectItemObservable);
    };

    /**
     * Constructs single template database manipulation observable for given template and all its base tempaltes
     * @see {@link this.buildInsertOrder} called and then joined by @see {@link Observable.flatMap}
     * @param {any} template Template to be stored
     * @param {Observable} insertSelectItemObservable database manipulation observable for single temple
     * @returns {Observable} Database manipulation combined observable 
     */
    this.buildAndConnectDatabaseObservables = function (template, insertSelectItemObservable) {
        const templateOrder = this.buildInsertOrder(template);
        const first = templateOrder.pop();
        var dbObservable = insertSelectItemObservable(first.jsonStructure.id, first.jsonStructure.isAbstract || false, undefined);

        while (templateOrder.length > 0) {
            var insertTemplate = templateOrder.pop();
            dbObservable = dbObservable.flatMap(baseId => insertSelectItemObservable(insertTemplate.jsonStructure.id, insertTemplate.jsonStructure.isAbstract || false, baseId));
        }

        return dbObservable;
    };

    /**
     * Builds an order array with templates
     * @example
     * // returns [t3, t2, t1]
     * template (t1) -> baseTemplate (t2) -> baseTemplate (t3)
     * @param {any} template Template to be build order from
     * @returns {Array} Ordered array with templates
     */
    this.buildInsertOrder = function (template) {
        var templateOrder = [];
        var currentTemplate = template;
        templateOrder.push(template);

        while (currentTemplate.baseTemplate) {
            templateOrder.push(currentTemplate.baseTemplate);
            currentTemplate = currentTemplate.baseTemplate;
        }

        return templateOrder;
    };
}