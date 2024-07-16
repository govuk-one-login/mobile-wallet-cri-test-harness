export const payloadSchema = {
  type: "object",
  properties: {
    aud: {
      type: "string",
      enum: ["urn:fdc:gov:uk:wallet"],
    },
    clientId: {
      type: "string",
      enum: ["EXAMPLE-CRI"],
    },
    iss: {
      type: "string",
      enum: ["urn:fdc:gov:uk:example-credential-issuer"],
    },
    credential_identifiers: {
      type: "array",
      items: { type: "string", format: "uuid" },
      minItems: 1,
      maxItems: 1,
    },
    iat: {
      type: "number",
    },
    exp: {
      type: "number",
    },
  },
  additionalProperties: false,
  required: ["aud", "clientId", "iss", "credential_identifiers", "iat", "exp"],
};
