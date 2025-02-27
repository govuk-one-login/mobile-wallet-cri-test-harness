export const payloadSchema = {
  type: "object",
  properties: {
    iss: {
      type: "string",
      minLength: 1,
    },
    sub: {
      type: "string",
      minLength: 1,
    },
    nbf: {
      type: "number",
    },
    exp: {
      type: "number",
    },
    "@context": {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
      minItems: 1,
    },
    type: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
      minItems: 2,
    },
    issuer: {
      type: "string",
      minLength: 1,
    },
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: "string",
      minLength: 1,
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
          minLength: 1,
        }
      },
      additionalProperties: true,
      required: ["id"],
    }
  },
  additionalProperties: true,
  required: ["iss", "sub", "nbf", "exp", "@context", "type", "issuer", "name", "description", "validFrom", "credentialSubject"],
};
