module.exports = RequirementDaoService;

const DatabaseService = require("./databaseservice");
const Observable = require("rxjs").Observable;
const combineLatest = require("rxjs").combineLatest;

/**
 * Data Access Object Service for requirements
 * @param {any} logger Logger
 * @param {DatabaseService} databaseService Database service to store and query elements
 */
function RequirementDaoService(logger, databaseService) {
    const oFn = require("../common/ofn");
    oFn.call(this);
    this.logger = logger;
    this.databaseService = databaseService;

    /**
     * Stores requirements
     * @param {Any} requirements Requirements
     * @returns {Observable} observable with requirement Id
     */
    this.storeRequirements = function (requirements) {
        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();
                const dbObjs = requirements.map(r => {
                    const dbObj = {};
                    dbObj[dbc.TemplateId] = r.templateId;
                    dbObj[dbc.ArtifactId] = r.artefactIdPath;
                    return dbObj;
                });

                return Observable.fromPromise(context(dbc.Artifacts).insert(dbObjs))
                    .map(v => {
                        this.logger.info("RequirementDaoService All requirements stored");
                        return v;
                    });
            });
    };

    /**
     * Gets all requirements
     * @returns {Observable} observable with pairs (Id and ArtifactId)
     */
    this.getAllRequirements = function () {
        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();
                return Observable.fromPromise(context(dbc.Artifacts)
                    .select(dbc.Id, dbc.ArtifactId))
                    .map(p => {
                        this.logger.info("RequirementDaoService All requirements gathered from database");
                        return p;
                    });
            });
    };

    /**
     * Stores requirements links
     * @param {Any} requirementLinks Requirements
     * @returns {Observable} observable with requirement Id
     */
    this.storeRequirementsLinks = function (requirementLinks) {
        if (!(requirementLinks && requirementLinks.length && requirementLinks.length > 0)) {
            return Observable.of(false);
        }

        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();
                const dbObjs = requirementLinks.map(r => {
                    const dbObj = {};
                    dbObj[dbc.SourceArtifactId] = r.SourceArtifactId;
                    dbObj[dbc.DestinationArtifactId] = r.DestinationArtifactId;
                    dbObj[dbc.FieldName] = r.FieldName;
                    return dbObj;
                });

                return Observable.fromPromise(context(dbc.ArtifactLinks).insert(dbObjs))
                    .map(v => {
                        this.logger.info("RequirementDaoService All requirements links stored");
                        return true;
                    });
            });
    };

    /**
     * Runs validation rule in database
     * @param {any} queryStructure Valiation rule query structure
     * @param {any} requirement Requirement to validate against
     * @returns {Observable} Observable with results
     */
    this.validateRule = function (queryStructure, requirement) {
        if (!this.checkQueryStructure(queryStructure)) {
            return Observable.of(true);
        }

        return this.databaseService
            .getContext()
            .flatMap(context => {
                const query = context(this.converTableDefinition(queryStructure.tables))
                    .count({ count: '*' })
                    .whereRaw(queryStructure.where.clause, this.convertTableParameters(queryStructure.where.parameters, requirement));

                return Observable.fromPromise(query);
            });
    };

    /**
     * Loads entire content of database
     * @returns {Observable} Observable that gets array of arrays (tables) of arrays (rows)
     */
    this.selectAllFromDatabase = function () {
        return this.databaseService
            .getContext()
            .flatMap(context => {
                const dbc = this.databaseService.DBConsts();
                return combineLatest(context(dbc.ArtifactTemplates).select(),
                    context(dbc.Artifacts).select(),
                    context(dbc.ArtifactLinks).select());
            });
    };

    this.convertTableParameters = function (parameters, requirement) {
        const valueConverter = {};
        valueConverter["@artifactId"] = requirement.artefactIdPath;

        const dbParameters = [];
        parameters.forEach(p => {
            if (p.startsWith("@")) {
                const value = valueConverter[p];
                if (!value) {
                    throw new "Unknown parameter in template validation query: " + p;
                } else {
                    dbParameters.push( value );
                }
            } else {
                dbParameters.push(p);
            }
        });
        return dbParameters;
    };    

    this.converTableDefinition = function (tables) {
        const dbTables = {};
        tables.forEach(table => {
            dbTables[table.alias] = table.table;
        });
        return dbTables;
    };

    this.checkQueryStructure = function (queryStructure) {
        const dbConst = this.databaseService.DBConsts();
        const validTables = [dbConst.ArtifactLinks, dbConst.Artifacts, dbConst.ArtifactTemplates];
        const tableChecker = (table) => {
            return table
                && table.alias
                && table.table
                && table.alias.length > 0
                && table.table.length > 0
                && validTables.indexOf(table.table) >= 0;
        };

        return queryStructure
            && queryStructure.tables
            && queryStructure.tables.length > 0
            && queryStructure.tables.every(tableChecker)
            && queryStructure.where
            && queryStructure.where.clause
            && queryStructure.where.clause.length > 1
            && queryStructure.where.parameters
            && queryStructure.where.parameters.length > 1;
    };
}