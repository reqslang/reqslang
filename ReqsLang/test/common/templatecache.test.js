const assert = require('assert');
const TemplateCache = require('./../../common/templatecache');

describe('TemplateCache', function () {
    const DefPath = "/path/sample";
    const SampleObj = {
        msg: "test"
    };

    function NewObj() {
        const tc = new TemplateCache();
        return tc;
    }

    describe('#ctor()', function () {
        it('creates an empty object', function () {
            const tc = NewObj();
            assert.ok(tc, "value created");
            assert.equal(0, tc._cacheArray.length, "Cache is empty");
        });
    });

    describe("#addTemplate()", function () {
        it('adds value to the cache', function () {
            const tc = NewObj();

            tc.addTemplate(DefPath, SampleObj);

            const cacheEntry = tc._cacheArray[0];
            assert.equal(SampleObj, cacheEntry.object, "Object passed to cache must be equal to the one added");
        });

        it('adds value to the cache with trimmed path', function () {
            const tc = NewObj();

            tc.addTemplate("   " + DefPath + "   ", SampleObj);

            const cacheEntry = tc._cacheArray[0];
            assert.equal(SampleObj, cacheEntry.object, "Object passed to cache must be equal to the one added");
            assert.equal(DefPath, cacheEntry.path, "Path passed to cache must be equal to the one added");
        });

        it('adds value to the cache with lowercase path', function () {
            const tc = NewObj();

            tc.addTemplate(DefPath.toUpperCase(), SampleObj);

            const cacheEntry = tc._cacheArray[0];
            assert.equal(SampleObj, cacheEntry.object, "Object passed to cache must be equal to the one added");
            assert.equal(DefPath, cacheEntry.path, "Path passed to cache must be equal to the one added");
        });

        it('adds value to the cache with trimmed lowercase path', function () {
            const tc = NewObj();

            tc.addTemplate("   " + DefPath.toUpperCase() + "   ", SampleObj);

            const cacheEntry = tc._cacheArray[0];
            assert.equal(SampleObj, cacheEntry.object, "Object passed to cache must be equal to the one added");
            assert.equal(DefPath, cacheEntry.path, "Path passed to cache must be equal to the one added");
        });

        it('prohibits duplicated value aded to the cache', function () {
            const tc = NewObj();
            var err = undefined;

            tc.addTemplate(DefPath, SampleObj);
            try {
                tc.addTemplate(DefPath, SampleObj);
            } catch (e) {
                err = e;
            }

            const cacheEntry = tc._cacheArray[0];
            assert.equal(1, tc._cacheArray.length);
            assert.equal(SampleObj, cacheEntry.object, "Object passed to cache must be equal to the one added");
            assert.notEqual(err, undefined, "Error cannot be undefined");
        });

        it('prohibits no path value aded to the cache', function () {
            const tc = NewObj();
            var err = undefined;

            try {
                tc.addTemplate("", SampleObj);
            } catch (e) {
                err = e;
            }

            assert.equal(0, tc._cacheArray.length);
            assert.notEqual(err, undefined, "Error cannot be undefined");
        });
    });

    describe("#getTemplate()", function () {
        it('what was added can be retained', function () {
            const tc = NewObj();

            tc.addTemplate(DefPath, SampleObj);

            const obj = tc.getTemplate(DefPath);
            assert.equal(SampleObj, obj, "Object passed to cache must be equal to the one added");
        });

        it('no error is thrown when returning non existing object', function () {
            const tc = NewObj();

            const obj = tc.getTemplate(DefPath);

            assert.equal(undefined, obj, "Undefined object is returned for non existent key");
        });


        it('what was added can be retained using trimmed and lowerCase key', function () {
            const tc = NewObj();

            tc.addTemplate(DefPath, SampleObj);

            const obj = tc.getTemplate("   " + DefPath.toUpperCase() + "   ");
            assert.equal(SampleObj, obj, "Object passed to cache must be equal to the one added");
        });

        it('prohibits no path value to be get from cache', function () {
            const tc = NewObj();
            var err = undefined;

            try {
                tc.getTemplate("");
            } catch (e) {
                err = e;
            }

            assert.equal(0, tc._cacheArray.length);
            assert.notEqual(err, undefined, "Error cannot be undefined");
        });
    });

    describe('#first()', function () {
        it('returns first element on cache with one element', function () {
            const tc = NewObj();
            tc.addTemplate(DefPath, SampleObj);
            
            const result = tc.first();

            assert.equal(result, SampleObj, "First object is returned");
        });

        it('returns first element on cache with two elements', function () {
            const tc = NewObj();
            tc.addTemplate(DefPath, SampleObj);
            tc.addTemplate(DefPath + "1", SampleObj);

            const result = tc.first();

            assert.equal(result, SampleObj, "First object is returned");
        });

        it('returns undefined with no elements', function () {
            const tc = NewObj();

            const result = tc.first();

            assert.equal(result, undefined, "For empty cache must be undefined");

        });
    });

    describe('#forEach', function () {
        it('iterates over cache objects', function () {
            const tc = NewObj();
            tc.addTemplate(DefPath, SampleObj);
            tc.addTemplate(DefPath + "1", SampleObj);
            let i = 0;

            tc.forEach(el => {
                i++;
                assert.equal(el, SampleObj);
            });

            assert.equal(i, 2, "Must return two objects");
        });
    });

    describe('#allKeys', function () {
        it('exposes all keys within cache', function () {
            const tc = NewObj();
            tc.addTemplate(DefPath, SampleObj);
            tc.addTemplate(DefPath + "1", SampleObj);

            const keys = tc.allKeys();

            assert.equal(keys.length, 2, "Two keys should be found in the array");
            assert.equal(keys[0], DefPath);
            assert.equal(keys[1], DefPath + "1");
        });
    });
});