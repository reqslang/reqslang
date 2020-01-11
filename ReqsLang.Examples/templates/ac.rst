{
  "id": "/templates/ac",
  "base": "/templates/base",
  "conversionRules": [
    {
      "field": "given",
      "path": "$.children[2].children[0].literal"
    },
    {
      "field": "when",
      "path": "$.children[2].children[5].literal"
    },
    {
      "field": "then",
      "path": "$.children[2].children[8].literal"
    }
  ],
  "verificationRules": {
    "type": "object",
    "properties": {
      "given": {
        "type": "string",
        "minLength": 7,
        "pattern":  "^Given "
      },
      "when": {
        "type": "string",
        "minLength": 6,
        "pattern": "^When "
      },
      "then": {
        "type": "string",
        "minLength": 6,
        "pattern": "^Then "
      }
    },
    "required": [ "given", "when", "then" ]
  },
  "validationRules": [
    {
      "name": "Acceptance Criteria must be linked to State definition artefact",
      "query": {
        "tables": [
          {
            "alias": "artifacts",
            "table": "Artifacts"
          },
          {
            "alias": "artifacts2",
            "table": "Artifacts"
          },
          {
            "alias": "artifactLinks",
            "table": "ArtifactLinks"
          },
          {
            "alias": "artifactTypes",
            "table": "ArtifactTemplates"
          }
        ],
        "where": {
          "clause": "?? = ? and ?? = ?? and ?? = ?? and ?? = ?? and ?? = ?",
          "parameters": [
            "artifacts.ArtifactId",
            "@artifactId",
            "artifacts.Id",
            "artifactLinks.SourceArtifactId",
            "artifactLinks.DestinationArtifactId",
            "artifacts2.Id",
            "artifacts2.TemplateId",
            "artifactTypes.Id",
            "artifactTypes.TemplateId",
            "/templates/state"
          ]
        }
      }
    }
  ]
}
