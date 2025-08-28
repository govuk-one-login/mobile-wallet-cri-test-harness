export const issuerSignedSchema = {
  $id: "issuer-signed",
  type: "object",
  required: ["nameSpaces", "issuerAuth"],
  properties: {
    nameSpaces: {
      type: "object",
      properties: {
        "org.iso.18013.5.1": { $ref: "iso-namespace" },
        "org.iso.18013.5.1.GB": { $ref: "domestic-namespace" },
      },
      required: ["org.iso.18013.5.1", "org.iso.18013.5.1.GB"],
      additionalProperties: false,
    },
    issuerAuth: {
      type: "array",
      minItems: 4,
      maxItems: 4,
    },
  },
  additionalProperties: false,
};
