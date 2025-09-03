export const isoNamespaceSchema = {
  $id: "iso-namespace",
  type: "array",
  minItems: 18,
  maxItems: 18,
  items: {
    type: "object",
    required: ["digestID", "elementIdentifier", "random", "elementValue"],
    additionalProperties: false,
    properties: {
      digestID: {
        type: "integer",
        minimum: 0,
        maximum: 2147483648,
      },
      elementIdentifier: {
        type: "string",
        enum: [
          "family_name",
          "given_name",
          "portrait",
          "birth_date",
          "age_over_18",
          "age_over_21",
          "age_over_25",
          "birth_place",
          "issue_date",
          "expiry_date",
          "issuing_authority",
          "issuing_country",
          "document_number",
          "resident_address",
          "resident_postal_code",
          "resident_city",
          "driving_privileges",
          "un_distinguishing_sign",
        ],
      },
      random: {
        type: "object",
        instanceofUint8Array: true,
      },
      elementValue: {
        anyOf: [
          { type: "boolean" },
          { type: "string" },
          { type: "object" },
          { type: "array" },
        ],
      },
    },
    allOf: [
      {
        if: {
          properties: {
            elementIdentifier: {
              enum: [
                "family_name",
                "given_name",
                "birth_place",
                "issuing_authority",
                "issuing_country",
                "document_number",
                "resident_address",
                "resident_postal_code",
                "resident_city",
                "un_distinguishing_sign",
              ],
            },
          },
        },
        then: {
          properties: {
            elementValue: { type: "string" },
          },
        },
      },
      {
        if: {
          properties: {
            elementIdentifier: {
              enum: ["age_over_18", "age_over_21", "age_over_25"],
            },
          },
        },
        then: {
          properties: {
            elementValue: { type: "boolean" },
          },
        },
      },
      {
        if: {
          properties: {
            elementIdentifier: {
              enum: ["birth_date", "issue_date", "expiry_date"],
            },
          },
        },
        then: {
          properties: {
            elementValue: {
              type: "string",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            },
          },
        },
      },
      {
        if: {
          properties: {
            elementIdentifier: { const: "driving_privileges" },
          },
        },
        then: {
          properties: {
            elementValue: {
              type: "array",
              items: {
                type: "object",
                required: ["vehicle_category_code"],
                properties: {
                  vehicle_category_code: { type: "string" },
                  issue_date: {
                    type: "string",
                    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  },
                  expiry_date: {
                    type: "string",
                    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  },
                  codes: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["code"],
                      properties: {
                        code: {
                          type: "string",
                        },
                        sign: {
                          type: "string",
                        },
                        value: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
      },
      {
        if: {
          properties: {
            elementIdentifier: { const: "portrait" },
          },
        },
        then: {
          properties: {
            elementValue: {
              type: "object",
              instanceofUint8Array: true,
            },
          },
        },
      },
    ],
  },
};
