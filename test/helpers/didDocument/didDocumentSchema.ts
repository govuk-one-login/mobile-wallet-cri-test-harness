export const didDocumentSchema = {
  type: "object",
  properties: {
    "@context": {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "string",
      },
      contains: {
        const: "https://www.w3.org/ns/did/v1",
      },
    },
    id: {
      type: "string",
      pattern: "^did:web:.*$",
    },
    verificationMethod: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            pattern: "^did:web:.*$",
          },
          type: {
            type: "string",
            enum: ["JsonWebKey2020"],
          },
          controller: {
            type: "string",
            pattern: "^did:web:.*$",
          },
          publicKeyJwk: {
            type: "object",
            properties: {
              kty: {
                type: "string",
                enum: ["EC"],
              },
              kid: {
                type: "string",
                minLength: 1,
              },
              crv: {
                type: "string",
                enum: ["P-256"],
              },
              x: {
                type: "string",
                minLength: 1,
              },
              y: {
                type: "string",
                minLength: 1,
              },
              alg: {
                type: "string",
                enum: ["ES256"],
              },
            },
            required: ["kty", "kid", "crv", "x", "y", "alg"],
            additionalProperties: false,
          },
        },
        required: ["id", "type", "controller", "publicKeyJwk"],
        additionalProperties: false,
      },
    },
    assertionMethod: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        pattern: "^did:web:.*$",
      },
    },
  },
  required: ["@context", "id", "verificationMethod", "assertionMethod"],
  additionalProperties: false,
};
