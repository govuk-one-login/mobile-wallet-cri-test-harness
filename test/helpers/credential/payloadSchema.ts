export const payloadSchema = {
  type: "object",
  properties: {
    iss: {
      type: "string",
      minLength: 1,
    },
    sub: {
      type: "string",
      pattern: "^did:key:[a-zA-Z0-9]+$",
    },
    nbf: {
      type: "number",
    },
    exp: {
      type: "number",
    },
    context: {
      type: "array",
      items: {
        type: "string"
      },
      minItems: 2,
      maxItems: 2,
    },
    type: {
      type: "array",
      items: {
        type: "string"
      },
      minItems: 2,
      maxItems: 2,
    },
    issuer: {
      type: "string",
    },
    name: {
      type: "string",
    },
    description: {
      type: "string",
    },
    validFrom: {
      type: "string",
      pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d)|3[01]T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\dZ$",
    },
    validUntil: {
      type: "string",
      pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d)|3[01]T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\dZ$",
    },
    credentialSubject: {
      type: "object",
      properties: {
        id: {
          type: "string",
          pattern: "^did:key:[a-zA-Z0-9]+$",
        }
      },
      additionalProperties: true,
      required: ["id"],
    },
  },
  additionalProperties: false,
  required: ["iss", "sub", "nbf", "exp", "@context", "type", "issuer", "name", "description", "validFrom", "validUntil", "credentialSubject"],
};
