{
  "id": "/templates/base",
  "isAbstract": true,
  "conversionRules": [
    {
      "field": "title",
      "path": "$.children[1].children[0].literal"
    }
  ],
  "verificationRules": {
    "type": "object",
    "properties": {
      "artefactType": {
        "type": "string",
        "format": "uri-reference"
      },
      "artefactId": {
        "type": "string",
        "format": "uri-reference"
      },
      "title": {
        "type": "string",
        "minLength": 1
      }
    },
    "required": [ "artefactType", "artefactId", "title" ]
  },
  "validationRules": [
  ]
}