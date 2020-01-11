{
  "id": "/templates/state",
  "base": "/templates/base",
  "conversionRules": [
    {
      "field": "initialValue",
      "path": "$.children[2].children[0].literal"
    }
  ],
  "verificationRules": {
    "type": "object",
    "properties": {
      "initialValue": {
        "type": "string",
        "minLength": 6,
        "pattern": "^Initial value: "
      }
    }
  },
  "required": [ "initialValue" ]
}