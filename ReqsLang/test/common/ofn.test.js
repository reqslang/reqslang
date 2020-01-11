const assert = require('assert');
const oFn = require('./../../common/ofn');
const Rx = require('rxjs/Rx');

describe('oFn', function () {

    function NewObj() {
        const tc = new oFn();
        return tc;
    }

    describe('#ctor()', function () {
        it('creates an empty object', function () {
            const ofn = NewObj();

            assert.ok(ofn, "value created");
        });
    });

    describe("#errorHandler", function () {
        it("calls error on given observable", function (done) {
            Rx.Observable.create((observer) => {
                const ofn = NewObj();
                ofn.errorHandler(1, observer);
            }).subscribe(_ => {
                done("there should be no next");
            }, err => {
                    assert.equal(err, 1);
                    done();
            }, _ => {
                    done("it should not be called");
            });
        });
    });

    describe("#oWrapper()", function () {
        it("executes given function", function (done) {
            const ofn = NewObj();

            ofn.oWrapper(o => { o.next(1); })
                .subscribe(v => {
                    assert.equal(v, 1);
                    done();
                }, err => {
                    done(err);
                }, _ => {
                    done("It should not be completed");
                });
        });

        it("handles error", function (done) {
            const ofn = NewObj();

            testError(ofn.oWrapper, done);
        });
    });

    describe("#ofWrapper()", function () {
        it("executes given function", function (done) {
            const ofn = NewObj();

            ofn.ofWrapper(o => { o.next(1); })
                .subscribe(v => {
                    assert.equal(v, 1);
                }, err => {
                    done(err);
                }, _ => {
                    done();
                });
        });

        it("handles error", function (done) {
            const ofn = NewObj();

            testError(ofn.ofWrapper, done);
        });
    });

    function testError(testFun, done) {
        testFun(o => { o.error(0); })
            .subscribe(v => {
                done("It should not be called");
            }, err => {
                    assert.equal(err, 0);
                    done();
            }, _ => { done("It should not be completed"); });
    }
});