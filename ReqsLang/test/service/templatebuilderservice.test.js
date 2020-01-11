const assert = require('assert');
const TemplateCache = require('./../../common/templatecache');
const TemplateBuilderService = require('./../../service/templatebuilderservice');

describe('TemplateBuilderService', function () {
    const P1 = "/a";
    const P2 = "/b";
    const P3 = "/c";

    describe("#throwOnLoop", function () {
        it("throws when result is true", function (done) {
            const tbs = newTbs();

            try {
                tbs.throwOnLoop({
                    result: true
                });
                done("it should not be present here");
            } catch (err) {
                done();
            }
        });

        it("does not throw when result is false", function (done) {
            const tbs = newTbs();

            try {
                tbs.throwOnLoop({
                    result: false
                });
                done();
            } catch (err) {
                done("it should not throw on false");
            }
        });
    });

    describe("#buildTemplates", function () {
        it("goes through steps in algorithm", function () {
            const templateValidationResults = mockValidationResults();
            const tbs = mockTbs();
            const tbsDummy = new TemplateBuilderService();
            
            const result = tbsDummy.buildTemplates.call(tbs, templateValidationResults);

            assert.equal(result instanceof TemplateCache, true, "Result must be template cache");
            assertFunCalls(tbs, templateValidationResults);
        });

        function mockValidationResults() {

            function buildVR(path) {
                return {
                    contentJson: {
                        id: path
                    }
                };
            }

            const templateValidationResults = [];
            [P1, P2].forEach(p =>
                templateValidationResults.push(buildVR(p)));
            return templateValidationResults;
        }

        const SplitObj = {
            withBase: [],
            withoutBase: []
        };

        const LoopCheck = {
        };

        function mockTbs() {
            return {
                checkExistanceOfAllBaseArtifactsAndSplit: function (vtc) {
                    this.checkExistanceOfAllBaseArtifactsAndSplit_vtc = vtc;
                    return SplitObj;
                },
                checkForLoopInBaseChain: function (vtc) {
                    this.checkForLoopInBaseChain_vtc = vtc;
                    return LoopCheck;
                },
                throwOnLoop: function (loopCheck) {
                    this.throwOnLoop_loopCheck = loopCheck;
                },
                buildTemplatesWithoutBase: function (arr, rtc) {
                    this.buildTemplatesWithoutBase_arr = arr;
                    this.buildTemplatesWithoutBase_rtc = rtc;
                },
                buildTemplatesWithBase: function (arr, rtc) {
                    this.buildTemplatesWithBase_arr = arr;
                    this.buildTemplatesWithBase_rtc = rtc;
                }
            };
        }

        function assertFunCalls(tbs, templateValidationResults) {
            assert.equal(tbs.checkExistanceOfAllBaseArtifactsAndSplit_vtc.allKeys().length, templateValidationResults.length);
            assert.equal(tbs.checkForLoopInBaseChain_vtc.allKeys().length, templateValidationResults.length);
            assert.equal(tbs.throwOnLoop_loopCheck, LoopCheck);
            assert.equal(tbs.buildTemplatesWithoutBase_arr, SplitObj.withoutBase);
            assert.equal(tbs.buildTemplatesWithoutBase_rtc instanceof TemplateCache, true);
            assert.equal(tbs.buildTemplatesWithBase_arr, SplitObj.withBase);
            assert.equal(tbs.buildTemplatesWithBase_rtc instanceof TemplateCache, true);
        }
    });

    describe("#checkForLoopInBaseChain()", function () {
        it("does not fail on empty list", function () {
            const tc = newTc().tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, false);
            assert.equal(result.source, undefined);
            assert.equal(result.destination, undefined);
        });

        it("returns false on single element without base", function () {
            const tc = newTc()
                .addTemplate(P1, undefined)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, false);
            assert.equal(result.source, undefined);
            assert.equal(result.destination, undefined);
        });


        it("returns false on list with two linked elements and list", function () {
            const tc = newTc()
                .addTemplate(P1, P2)
                .addTemplate(P2, undefined)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, false);
            assert.equal(result.source, undefined);
            assert.equal(result.destination, undefined);
        });

        it("returns false on list with three unlinked elements and list", function () {
            const tc = newTc()
                .addTemplate(P1)
                .addTemplate(P2)
                .addTemplate(P3)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, false);
            assert.equal(result.source, undefined);
            assert.equal(result.destination, undefined);
        });


        it("returns false on list with three linked elements and list", function () {
            const tc = newTc()
                .addTemplate(P1)
                .addTemplate(P2, P1)
                .addTemplate(P3, P1)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, false);
            assert.equal(result.source, undefined);
            assert.equal(result.destination, undefined);
        });

        it("returns true on loop with two elements", function () {
            const tc = newTc()
                .addTemplate(P1, P2)
                .addTemplate(P2, P1)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, true);
            assert.notEqual(result.source, undefined);
            assert.notEqual(result.destination, undefined);
        });

        it("returns true on loop with three elements", function () {
            const tc = newTc()
                .addTemplate(P1, P2)
                .addTemplate(P2, P1)
                .addTemplate(P3, P1)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkForLoopInBaseChain(tc);

            assert.equal(result.result, true);
            assert.notEqual(result.source, undefined);
            assert.notEqual(result.destination, undefined);
        });
    });

    describe("#checkExistanceOfAllBaseArtifactsAndSplit()", function () {
        it("splits cache with 3 elements with base", function () {
            const tc = newTc()
                .addTemplate(P1, P2)
                .addTemplate(P2, P1)
                .addTemplate(P3, P1)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkExistanceOfAllBaseArtifactsAndSplit(tc);

            assert.equal(result.withBase.length, 3);
            assert.equal(result.withoutBase.length, 0);
        });

        it("splits cache with 3 elements without base", function () {
            const tc = newTc()
                .addTemplate(P1)
                .addTemplate(P2)
                .addTemplate(P3)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkExistanceOfAllBaseArtifactsAndSplit(tc);

            assert.equal(result.withBase.length, 0);
            assert.equal(result.withoutBase.length, 3);
        });

        it("splits cache with 3 elements", function () {
            const tc = newTc()
                .addTemplate(P1)
                .addTemplate(P2, P1)
                .addTemplate(P3, P1)
                .tc();
            const tbs = newTbs();

            const result = tbs.checkExistanceOfAllBaseArtifactsAndSplit(tc);

            assert.equal(result.withBase.length, 2);
            assert.equal(result.withoutBase.length, 1);
        });

        it("splits cache with no elements", function () {
            const tc = newTc()
                .tc();
            const tbs = newTbs();

            const result = tbs.checkExistanceOfAllBaseArtifactsAndSplit(tc);

            assert.equal(result.withBase.length, 0);
            assert.equal(result.withoutBase.length, 0);
        });

        it("throws on element with unknown base", function (done) {
            const tc = newTc()
                .addTemplate(P1)
                .addTemplate(P2, P1)
                .addTemplate(P3, "test")
                .tc();
            const tbs = newTbs();

            try {
                tbs.checkExistanceOfAllBaseArtifactsAndSplit(tc);
                done("Failure, it should throw an exception");
            } catch (err) {
                assert.equal(true, new String(err).endsWith("id: " + P3));
                done();
            }
        });
    });

    describe("#buildTemplateWithBase()", function () { 
        it("gets already resolved templates", function () {
            const rtc = newTc()
                .addTemplate(P1)
                .addTemplate(P2, P1)
                .tc();
            const tbs = newTbs();

            const template = tbs.buildTemplateWithBase({
                id: P2,
                base: P1
            }, rtc);

            assert.equal(template.id, P2);
            assert.equal(template.base, P1);
        });
    });

    function newTbs() {
        return new TemplateBuilderService();
    }

    function newTc() {
        return {
            _tc: new TemplateCache(),
            addTemplate: function (path, base) {
                addTemplateTo(this._tc, path, base);
                return this;
            },
            tc: function () {
                return this._tc;
            }
        };
    }

    function addTemplateTo(tc, path, base) {
        const t = {
            id: path,
            base: base
        };
        tc.addTemplate(path, t);
    }
});