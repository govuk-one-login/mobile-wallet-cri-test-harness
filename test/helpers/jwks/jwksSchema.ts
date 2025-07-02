export const jwksSchema = {
  type: "object",
  properties: {
    keys: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          kty: { type: "string" },
          crv: { type: "string" },
          x: { type: "string" },
          y: { type: "string" },
          kid: { type: "string" },
          use: { type: "string" },
          alg: { type: "string" },
        },
        required: ["kty", "crv", "x", "y", "kid", "use", "alg"],
        additionalProperties: true,
      },
      contains: {
        type: "object",
        properties: {
          kty: { const: "EC" },
          crv: { const: "P-256" },
        },
        required: ["kty", "crv", "x", "y", "kid", "use", "alg"],
      },
    },
  },
  required: ["keys"],
  additionalProperties: false,
};
