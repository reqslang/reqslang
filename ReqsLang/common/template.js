module.exports = Template;

function Template(templateStructure) {
    this.jsonStructure = templateStructure;
    this.baseTemplate = undefined;

    this.getConversionRules = function () {
        const getThisRules = () => {
            return this.jsonStructure.conversionRules;
        };

        const getBaseRules = () => {
            return this.baseTemplate.getConversionRules();
        };

        const extractKey = (rule) => {
            return rule.field.trim();
        };

        return this.getEffectiveRules(getThisRules, getBaseRules, extractKey);
    };

    this.createVerificationRulesGetterFromThis = function () {
        return () => {
            if (!(this.jsonStructure.verificationRules
                && this.jsonStructure.verificationRules.properties)) {
                return [];
            }

            const props = this.jsonStructure.verificationRules.properties;
            return this.convertToArray(props);
        };
    };

    this.getVerificationType = function () {
        var targetType = undefined;

        if (this.jsonStructure
            && this.jsonStructure.verificationRules
            && this.jsonStructure.verificationRules.type) {
            targetType = this.jsonStructure.verificationRules.type;
        }

        if (!targetType && this.baseTemplate) {
            targetType = this.baseTemplate.getVerificationType();
        }

        if (!targetType) {
            targetType = "object";
        }

        return targetType;
    };

    this.getVerificationRequired = function () {
        if (this.jsonStructure.verificationRules
            && this.jsonStructure.verificationRules.required) {
            return this.jsonStructure.verificationRules.required;
        }

        return [];
    };

    this.getRequiredVerificationRules = function () {
        const getThisRules = () => {
            return this.getVerificationRequired();
        };

        const getBaseRules = () => {
            return this.baseTemplate.getVerificationRequired();
        };

        const extractKey = (rule) => {
            return rule.trim();
        };

        return this.getEffectiveRules(getThisRules, getBaseRules, extractKey);
    };


    this.getVerificationRules = function () {
        const getThisRules = this.createVerificationRulesGetterFromThis();

        const getBaseRules = () => {
            return this.convertToArray(this.baseTemplate.getVerificationRules().properties);
        };

        const extractKey = (rule) => {
            return rule.field.trim();
        };

        const effectiveRules = this.getEffectiveRules(getThisRules, getBaseRules, extractKey);
        const targetType = this.getVerificationType();
        const required = this.getRequiredVerificationRules();
        const effectiveProperties = {};
        effectiveRules.forEach(kv => effectiveProperties[kv.field] = kv.value);

        return {
            type: targetType,
            required: required,
            properties: effectiveProperties
        };
    };

    this.getEffectiveRules = function (getThisRules, getBaseRules, extractKey) {
        if (!this.baseTemplate) {
            const thisRules = getThisRules();
            return thisRules;
        } else {
            const baseRules = getBaseRules();
            const thisRules = getThisRules();
            const mergedRules = [];
            baseRules.forEach(baseRule => {
                const baseRuleField = extractKey(baseRule);
                if (!thisRules.find(convRule => baseRuleField === extractKey(convRule))) {
                    mergedRules.push(baseRule);
                }
            });
            thisRules.forEach(rule => mergedRules.push(rule));
            return mergedRules;
        }
    };

    this.convertToArray = function (props) {
        const results = [];
        for (var key in props) {
            var value = props[key];
            var entryToBeMerged = {
                field: key,
                value: value
            };
            results.push(entryToBeMerged);
        }
        return results;
    };
}