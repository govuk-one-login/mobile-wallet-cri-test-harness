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
    // mdoc_iacas_uri is required in mDoc credentials only
    mdoc_iacas_uri: {
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
