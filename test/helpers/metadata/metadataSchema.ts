export const metadataSchema = {
  type: "object",
  properties: {
    credential_endpoint: {
      type: "string",
      format: "uri",
    },
    authorization_servers: {
      type: "array",
      items: {
        type: "string",
        format: "uri",
      },
      minItems: 1,
    },
    credential_issuer: {
      type: "string",
      format: "uri",
    },
    notification_endpoint: {
      type: "string",
      format: "uri",
    },
    credential_configurations_supported: {
      type: "object",
    },
  },
  additionalProperties: true,
  required: [
    "credential_endpoint",
    "authorization_servers",
    "credential_issuer",
    "credential_configurations_supported",
  ],
};
