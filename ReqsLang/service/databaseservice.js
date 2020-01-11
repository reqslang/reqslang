module.exports = DatabaseService;


function DatabaseService(logger, configService) {
    const oFn = require("./../common/ofn");
    oFn.call(this);
    this.logger = logger;
    this.configService = configService;
    
    this.initiated = false;
    this.knex = undefined;

    this.getContext = function () {
        const giveResult = (observer) => {
            observer.next(this.knex);
            observer.complete();
        };

        return this.oWrapper((observer) => {
            if (!this.initiated) {
                this.init().subscribe(_ => giveResult(observer), err => observer.error(err));
            } else {
                giveResult(observer);
            }
        });
    };

    this.destroy = function () {
        return this.oWrapper((observer) => {
            if (!this.initiated) {
                observer.next(true);
                observer.complete();
            }

            this.knex.destroy().then(_ => {
                observer.next(true);
            }, err => {
                    observer.error(err);
            }).finally(() => {
                this.initiated = false;
                this.knex = undefined;
                observer.complete();
            });
        });
    };

    this.init = function () {
        return this.oWrapper((observer) => {
            if (this.initiated) {
                observer.next(true);
                observer.complete();
            }

            this.configService.getConfig().subscribe(c => {
                const dbConfig = c.database;
                const Knex = require('knex');
                this.initiated = true;

                this.knex = Knex({
                    client: dbConfig.client,
                    connection: dbConfig.connection,
                    pool: dbConfig.pool,
                    acquireConnectionTimeout: dbConfig.acquireConnectionTimeout,
                    useNullAsDefault: dbConfig.useNullAsDefault,
                    log: {
                        warn: (message) => {
                            this.logger.warn(message);
                        },
                        error: (message) => {
                            this.logger.error(message);
                        },
                        deprecate: (message) => {
                            this.logger.warn(message);
                        },
                        debug: (message) => {
                            this.logger.debug(message);
                        }
                    }
                });

                this.createTables().last().subscribe(_ => {
                    observer.next(true);
                    observer.complete();
                }, err => observer.error(err), _ => observer.complete());
            });
        });
    };

    this.createTables = function () {
        const Observable = require("rxjs").Observable;
        const tasks = [this.createTemplatesTable(), this.createArtifactsTable(), this.createLinksTable()];
        return Observable.forkJoin(tasks);
    };

    this.createTemplatesTable = function () {
        return this.ocWrapper((observer, c) => {
            this.knex.schema.createTable(c.ArtifactTemplates, function (table) {
                table.increments(c.Id).primary();
                table.string(c.TemplateId);
                table.integer(c.BaseId).nullable();
                table.boolean(c.IsAbstract);
            }).then(_ => {
                observer.next(true);
                observer.complete();
            }, err => observer.error(err));
        });
    };

    this.createArtifactsTable = function () {
        return this.ocWrapper((observer, c) => {
            this.knex.schema.createTable(c.Artifacts, function (table) {
                table.increments(c.Id).primary();
                table.integer(c.TemplateId);
                table.string(c.ArtifactId);
            }).then(_ => {
                observer.next(true);
                observer.complete();
            }, err => observer.error(err));
        });
    };

    this.createLinksTable = function () {
        return this.ocWrapper((observer, c) => {
            this.knex.schema.createTable(c.ArtifactLinks, function (table) {
                table.increments(c.Id).primary();
                table.integer(c.SourceArtifactId);
                table.integer(c.DestinationArtifactId);
                table.string(c.FieldName).nullable();
            }).then(_ => {
                observer.next(true);
                observer.complete();
            }, err => observer.error(err));
        });
    };

    this.ocWrapper = function (fnc) {
        return this.oWrapper((observer) => {
            fnc(observer, this.DBConsts());
        });
    };

    this.DBConsts = function () {
        return {
            ArtifactTemplates: "ArtifactTemplates",
            Id: "Id",
            TemplateId: "TemplateId",
            BaseId: "BaseId",
            IsAbstract: "IsAbstract",
            Artifacts: "Artifacts",
            ArtifactId: "ArtifactId",
            ArtifactLinks: "ArtifactLinks",
            SourceArtifactId: "SourceArtifactId",
            DestinationArtifactId: "DestinationArtifactId",
            FieldName: "FieldName"
        };
    };
}
