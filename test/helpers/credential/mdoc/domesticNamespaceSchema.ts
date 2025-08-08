import { CBOR_TAGS } from "./cborTags";

export const domesticNamespaceSchema = {
  $id: "domestic-namespace",
  type: "array",
  minItems: 2,
  maxItems: 3,
  items: {
    type: "object",
    required: ["tag", "value"],
    additionalProperties: false,
    properties: {
      tag: {
        type: "integer",
        enum: [CBOR_TAGS.ENCODED_CBOR],
      },
      value: {
        type: "object",
        properties: {
          digestID: {
            type: "integer",
            minimum: 0,
            maximum: 2147483648,
          },
          random: {
            type: "object",
            instanceof: "Buffer",
            description: "Node.js Buffer object containing binary data",
          },
          elementIdentifier: {
            type: "string",
            enum: ["title", "welsh_licence", "provisional_driving_privileges"],
          },
          elementValue: {
            anyOf: [
              { type: "boolean" },
              { type: "string" },
              { type: "object" },
            ],
          },
        },
        required: ["digestID", "elementIdentifier", "random", "elementValue"],
        additionalProperties: false,
        allOf: [
          {
            if: {
              properties: {
                elementIdentifier: {
                  const: "welsh_licence",
                },
              },
            },
            then: {
              properties: {
                elementValue: {
                  type: "boolean",
                },
              },
            },
          },
          {
            if: {
              properties: {
                elementIdentifier: {
                  const: "title",
                },
              },
            },
            then: {
              properties: {
                elementValue: {
                  type: "string",
                },
              },
            },
          },
          {
            if: {
              properties: {
                elementIdentifier: {
                  const: "provisional_driving_privileges",
                },
              },
            },
            then: {
              properties: {
                elementValue: {
                  type: "object",
                  required: ["vehicle_category_code"],
                  properties: {
                    vehicle_category_code: { type: "string" },
                    issue_date: {
                      type: "object",
                      required: ["tag", "value"],
                      properties: {
                        tag: {
                          type: "integer",
                          enum: [CBOR_TAGS.FULL_DATE_STRING],
                        },
                        value: {
                          type: "string",
                          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                        },
                      },
                    },
                    expiry_date: {
                      type: "object",
                      required: ["tag", "value"],
                      properties: {
                        tag: {
                          type: "integer",
                          enum: [CBOR_TAGS.FULL_DATE_STRING],
                        },
                        value: {
                          type: "string",
                          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
};
