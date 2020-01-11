const assert = require('assert');
const Template = require('./../../common/template');

describe('Template', function () {

    const Field1 = "field1";
    const Field2 = "field2";
    const Field3 = "field3";
    const Value1 = "value1";
    const Value2 = "value2";
    const Value3 = "value3";

    function NewObj(tc, base) {
        const t = new Template(tc);
        t.baseTemplate = base;
        return t;
    }

    describe('#ctor()', function () {
        it('creates an object with given structure', function () {
            const s = {};
            const t = NewObj(s);

            assert.equal(t.jsonStructure, s, "Structure is same");
            assert.equal(t.baseTemplate, undefined, "Base is empty");
        });

        it('creates an object with given structure and base', function () {
            const s = {};
            const b = NewObj(s);
            const t = NewObj(s, b);

            assert.equal(t.jsonStructure, s, "Structure is same");
            assert.equal(t.baseTemplate, b, "Base is empty");
        });
    });

    describe('#createVerificationRulesGetterFromThis', function () {
        it('returns all field rules', function () {
            const jsStructure = {
                verificationRules: {
                    properties: { }
                }
            };
            jsStructure.verificationRules.properties[Field1] = Value1;
            jsStructure.verificationRules.properties[Field2] = Value2;
            const obj = NewObj(jsStructure, undefined);

            const result = obj.createVerificationRulesGetterFromThis()();

            assert.equal(result.length, 2, "all values returned");
            assert.equal(result[0].field, Field1, "Field name of 1st element is correct");
            assert.equal(result[0].value, Value1, "Value of 1st element is correct");
            assert.equal(result[1].field, Field2, "Field name of 2nd element is correct");
            assert.equal(result[1].value, Value2, "Value of 2nd element is correct");
        });
    });

    describe('#getVerificationType', function () {
        it('returns target type from current', function () {
            const jsStructure = {
                verificationRules: {
                    type: Value3
                }
            };
            const obj = NewObj(jsStructure, undefined);

            const result = obj.getVerificationType();

            assert.equal(result, Value3, "correct value is returned");
        });
        

        it('returns target type from base', function () {
            const jsStructure = {
                verificationRules: {
                    type: Value3
                }
            };
            const obj = NewObj(undefined, NewObj(jsStructure));

            const result = obj.getVerificationType();

            assert.equal(result, Value3, "correct value is returned");
        });

        it('returns target type from current when base is present', function () {
            const jsStructure = {
                verificationRules: {
                    type: Value2
                }
            };
            const jsStructureBase = {
                verificationRules: {
                    type: Value3
                }
            };
            const obj = NewObj(jsStructure, NewObj(jsStructureBase));

            const result = obj.getVerificationType();

            assert.equal(result, Value2, "correct value is returned");
        });

        it('returns target type without identifier', function () {
            const obj = NewObj(undefined, undefined);

            const result = obj.getVerificationType();

            assert.equal(result, "object", "Default is object");
        });
    });

    describe('#getVerificationRequired', function () {
        it('returns empty on undefined verificationRule', function () {
            const jsStructure = {};
            const obj = NewObj(jsStructure);

            const result = obj.getVerificationRequired();

            assert.equal(result.length, 0, "Correct value returned");
        });

        it('returns empty on undefined required', function () {
            const jsStructure = {
                verificationRules: {}
            };
            const obj = NewObj(jsStructure);

            const result = obj.getVerificationRequired();

            assert.equal(result.length, 0, "Correct value returned");
        });


        it('returns required from current', function () {
            const jsStructure = {
                verificationRules: {
                    required: [Value1, Value2]
                }
            };
            const obj = NewObj(jsStructure);

            const result = obj.getVerificationRequired();

            assert.equal(result.length, 2, "Correct value returned");
            assert.equal(result[0], Value1, "Correct 1st value");
            assert.equal(result[1], Value2, "Correct 2nd value");
        });
    
    });

    describe('#getConversionRules', function () {

        function createFakeObjWithEffectiveRulesFn() {
            const obj = {
                resultObj: [],
                getEffectiveRules: function (fn1, fn2, fn3) {
                    this.fn1 = fn1;
                    this.fn2 = fn2;
                    this.fn3 = fn3;
                    return this.resultObj;
                },
                fn1: undefined,
                fn2: undefined,
                fn3: undefined
            };

            return obj;
        }

        it('calls getEffectiveRules', function () {
            const obj = createFakeObjWithEffectiveRulesFn();
            const fObj = new Template({});

            const result = fObj.getConversionRules.call(obj, undefined);

            assert.equal(result, obj.resultObj, "result is returned");
            assert.equal(typeof obj.fn1, "function", "Function is passed as 1st argument");
            assert.equal(typeof obj.fn2, "function", "Function is passed as 2nd argument");
            assert.equal(typeof obj.fn3, "function", "Function is passed as 3rd argument");
        });
    });

    describe('#getVerificationRules', function () {
        const jsStructure = {
            verificationRules: {
                required: [Value1, Value2],
                type: Value3,
                properties: {}
            }
        };
        jsStructure.verificationRules.properties[Field1] = { type: Value1 };
        jsStructure.verificationRules.properties[Field2] = { type: Value2 };
        const obj = NewObj(jsStructure);

        const result = obj.getVerificationRules();

        assert.equal(result.type, Value3, 'correct type returned');
        assert.equal(result.properties[Field1].type, Value1, 'correct 1st property');
        assert.equal(result.properties[Field2].type, Value2, 'correct 1st property');
        assert.equal(result.required.length, 2, 'correct size of required returned');
        assert.equal(result.required[0], Value1, 'required 1st element returned');
        assert.equal(result.required[1], Value2, 'required 2nd element returned');
    });

    describe('#getEffectiveRules()', function () {

        function NewConvRule(fieldName, path) {
            return {
                "field": fieldName,
                "path": path
            };
        }

        function NewConvRule1() {
            return NewConvRule(Field1, Value1);
        }

        function NewConvRule2() {
            return NewConvRule(Field2, Value2);
        }

        function NewConvRule3() {
            return NewConvRule(Field3, Value3);
        }

        function NewConvRule23() {
            return NewConvRule(Field2, Value3);
        }

        function createObject(convRules, baseConvRules) {
            function createJSStructure(array) {
                return {
                    conversionRules: array
                };
            }

            var baseObj = undefined;

            if (baseConvRules) {
                baseObj = NewObj(createJSStructure(baseConvRules));
            }

            const innerObj = NewObj(createJSStructure(convRules), baseObj);

            const outerObj = {
                innerObj: innerObj,
                getEffectiveRules: function () {

                    const getThisRules = () => {
                        return this.innerObj.jsonStructure.conversionRules;
                    };

                    const getBaseRules = () => {
                        return this.innerObj.baseTemplate.getConversionRules();
                    };

                    const extractKey = (rule) => {
                        return rule.field.trim();
                    };

                    return this.innerObj.getEffectiveRules(getThisRules, getBaseRules, extractKey);
                }
            };

            return outerObj;
        }

        it('will not break on empty object', function () {
            const obj = createObject([], []);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 0, "empty array is returned");
        });

        it('will not break on undefined base', function () {
            const obj = createObject([], undefined);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 0, "empty array is returned");
        });

        it('one in base only', function () {
            const r1 = NewConvRule1();
            const obj = createObject([], [r1]);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 1, "one value is returned");
            assert.equal(rules[0], r1, "correct value is returned");
        });


        it('two in base only', function () {
            const r1 = NewConvRule1();
            const r2 = NewConvRule2();
            const obj = createObject([], [r1, r2]);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 2, "two values are returned");
            assert.equal(rules[0], r1, "correct value is returned");
            assert.equal(rules[1], r2, "correct value is returned");
        });

        it('one in current only', function () {
            const r1 = NewConvRule1();
            const obj = createObject([r1], []);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 1, "one value is returned");
            assert.equal(rules[0], r1, "correct value is returned");
        });

        it('two in current only', function () {
            const r1 = NewConvRule1();
            const r2 = NewConvRule2();
            const obj = createObject([r1, r2], []);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 2, "two values are returned");
            assert.equal(rules[0], r1, "correct value is returned");
            assert.equal(rules[1], r2, "correct value is returned");
        });

        it('one in current, two in base', function () {
            const r1 = NewConvRule1();
            const r2 = NewConvRule2();
            const r3 = NewConvRule3();
            const obj = createObject([r3], [r1, r2]);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 3, "three values are returned");
            assert.equal(rules[0], r1, "correct value is returned");
            assert.equal(rules[1], r2, "correct value is returned");
            assert.equal(rules[2], r3, "correct value is returned");
        });

        it('two in current, one in base', function () {
            const r1 = NewConvRule1();
            const r2 = NewConvRule2();
            const r3 = NewConvRule3();
            const obj = createObject([r2, r3], [r1]);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 3, "three values are returned");
            assert.equal(rules[0], r1, "correct value is returned");
            assert.equal(rules[1], r2, "correct value is returned");
            assert.equal(rules[2], r3, "correct value is returned");
        });


        it('two in current, one in base with override', function () {
            const r1 = NewConvRule1();
            const r2 = NewConvRule2();
            const r3 = NewConvRule23();
            const obj = createObject([r3, r1], [r2]);

            const rules = obj.getEffectiveRules();

            assert.equal(rules.length, 2, "two values are returned");
            assert.equal(rules[0], r3, "correct value is returned");
            assert.equal(rules[1], r1, "correct value is returned");
        });
    });

});
