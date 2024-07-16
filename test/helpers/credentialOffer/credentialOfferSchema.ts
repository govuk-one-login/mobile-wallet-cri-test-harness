export const credentialOfferSchema = {
  type: "object",
  properties: {
    credential_issuer: {
      type: "string",
      format: "uri",
    },
    credentials: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
      minItems: 1,
    },
    grants: {
      type: "object",
      properties: {
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
          type: "object",
          properties: {
            "pre-authorized_code": {
              type: "string",
              minLength: 1,
            },
          },
          additionalProperties: false,
          required: ["pre-authorized_code"],
        },
      },
      additionalProperties: false,
      required: ["urn:ietf:params:oauth:grant-type:pre-authorized_code"],
    },
  },
  additionalProperties: false,
  required: ["credential_issuer", "credentials", "grants"],
};
