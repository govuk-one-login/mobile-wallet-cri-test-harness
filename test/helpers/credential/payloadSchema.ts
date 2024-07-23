export const payloadSchema = {
  type: "object",
  properties: {
    sub: {
      type: "string",
      minLength: 1,
    },
    iss: {
      type: "string",
      enum: ["urn:fdc:gov:uk:example-credential-issuer"],
    },
    vc: {
      type: "object",
    },
  },
  additionalProperties: true,
  required: ["iss", "sub", "vc"],
};
