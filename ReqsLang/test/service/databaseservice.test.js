const assert = require('assert');
const DatabaseService = require('./../../service/databaseservice');
const Rx = require('rxjs');

describe('DatabaseService', function () {

    describe('#getContext()', function () {
        
        it('initiates context on non initiated context', function (done) {
            const ds = newDs();

            try {
                var c = undefined;
                ds.getContext().subscribe(gc => {
                    c = gc;
                    assert.notEqual(c, undefined);
                }, err => done(err), _ => destroyDb(c, done, "empty context"));
            } catch (e) {
                done("it should NOT throw in this case");
            }
        });

        it('returns context on initiated context', function (done) {
            const ds = newDs();

            try {
                var c = undefined;
                ds.init().subscribe(_ => {
                    ds.getContext().subscribe(gc => {
                        c = gc;
                        assert.notEqual(c, undefined);
                    }, err => done(err));
                }, err => done(err), _ => destroyDb(c, done, "empty context"));
            } catch (e) {

                done(e);
            }
        });
    });

    describe("#init()", function () {
        it("allows to query data on properly initiated context", function (done) {
            const ds = newDs();
            
            try {
                ds.init().subscribe(_ => {
                    ds.getContext().subscribe(gc => {
                        c = gc;
                        c.raw("SELECT sqlite_version()")
                            .then(_ => { }, err => done(err))
                            .finally(() => destroyDb(c, done, "dbl init"));
                    }, err => done(err));                   
                }, err => done(err));
            } catch (e) {
                done(e);
            }
        });

        it("does not allow double init", function (done) {
            const ds = newDs();
            const dbc = ds.DBConsts();
            const mockObj = setupDataMockObj(dbc);

            try {
                ds.init().subscribe(_ => {
                    ds.getContext().subscribe(gc => {
                        c = gc;
                        c(dbc.ArtifactTemplates).insert(mockObj).then(_ => {
                            ds.init().subscribe(_ => {
                                c(dbc.ArtifactTemplates).select("*").then(results => {
                                    assert.equal(results.length, 1, "database should not remove any values");
                                    assertDataMockObj(results[0], mockObj);
                                }, reject => done(reject)).finally(_ => destroyDb(c, done, "dbl init"));
                            }, err => done(err));
                        }, reject => done(reject));
                    }, err => done(err));
                }, err => done(err));
            } catch (e) {
                done(e);
            }
        });
    });

    describe("#destroy", function () {

        it("doesn't destroy when no initiated and throws no exceptions", function (done) {
            const ds = newDs();

            try {
                ds.destroy().subscribe(_ => { }, err => done(err), _ => done());
            } catch (e) {
                done(e);
            }
        });

        it("destroys the object when initatited", function (done) {
            const ds = newDs();

            try {
                ds.init().subscribe(_ => { }, err => done(err), () => {
                    ds.destroy().subscribe(_ => { }, err => done(err), _ => done());
                });
            } catch (e) {
                done(e);
            }
        });
    });

    function assertDataMockObj(actual, mockObj) {
        assert.equal(actual[dbc.TemplateId], mockObj[dbc.TemplateId]);
        assert.equal(actual[dbc.IsAbstract], mockObj[dbc.IsAbstract]);
    }

    function setupDataMockObj(dbc) {
        const mockObj = {};
        mockObj[dbc.TemplateId] = "/a";
        mockObj[dbc.IsAbstract] = false;
        return mockObj;
    }

    function destroyDb(c, done, from) {
        c.destroy(err => {
            if (err) {
                console.log(err);
                done(err);
            }

            done();
        });
    }

    function newDs() {
        const ds = new DatabaseService(mockLocker(), mockConfigService());
        return ds;
    }

    function mockLocker() {
        return {
            warn: function (m) { },
            error: function (m) { assert.fail(m); },
            debug: function (m) { console.log("debug: " + m); }
        };
    }

    function mockConfigService() {
        return {
            getConfig: function () {
                return Rx.Observable.of({
                    database: {
                        client: "sqlite3",
                        connection: ":memory:" ,
                        pool: {
                            min: 1,
                            max: 1,
                            "idleTimeoutMillis": 360000000
                        }
                    }
                });
            }
        };
    }
});