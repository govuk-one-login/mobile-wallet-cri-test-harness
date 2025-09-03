export const mobileSecurityObjectSchema = {
  $id: "mobile-security-object",
  type: "object",
  // TODO: add `status` to `required` and change `additionalProperties` to `false` when the mDL issuer has integrated with the status list
  required: [
    "version",
    "digestAlgorithm",
    "deviceKeyInfo",
    "valueDigests",
    "docType",
    "validityInfo",
  ],
  additionalProperties: true,
  properties: {
    version: {
      type: "string",
      enum: ["1.0"],
    },
    digestAlgorithm: {
      type: "string",
      enum: ["SHA-256"],
    },
    deviceKeyInfo: {
      type: "object",
      required: ["deviceKey", "keyAuthorizations"],
      additionalProperties: false,
      properties: {
        deviceKey: {
          type: "object",
          instanceofMap: true,
        },
        keyAuthorizations: {
          type: "object",
          required: ["nameSpaces"],
          additionalProperties: false,
          properties: {
            nameSpaces: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: [
                { const: "org.iso.18013.5.1.GB" },
                { const: "org.iso.18013.5.1" },
              ],
              additionalItems: false,
            },
          },
        },
      },
    },
    valueDigests: {
      type: "object",
      required: ["org.iso.18013.5.1.GB", "org.iso.18013.5.1"],
      additionalProperties: false,
      properties: {
        "org.iso.18013.5.1.GB": {
          type: "object",
          instanceofMap: true,
          additionalProperties: false,
        },
        "org.iso.18013.5.1": {
          type: "object",
          instanceofMap: true,
          additionalProperties: false,
        },
      },
    },
    docType: {
      type: "string",
      enum: ["org.iso.18013.5.1.mDL"],
    },
    validityInfo: {
      type: "object",
      required: ["signed", "validFrom", "validUntil"],
      properties: {
        signed: { type: "string", format: "date-time" },
        validFrom: { type: "string", format: "date-time" },
        validUntil: { type: "string", format: "date-time" },
      },
      additionalProperties: false,
    },
    status: {
      type: "object",
      required: ["status_list"],
      properties: {
        status_list: {
          type: "object",
          required: ["idx", "uri"],
          properties: {
            idx: { type: "number" },
            uri: { type: "string", format: "uri" },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
};
