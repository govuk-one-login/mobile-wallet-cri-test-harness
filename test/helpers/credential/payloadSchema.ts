export const payloadSchema = {
  type: "object",
  properties: {
    sub: {
      type: "string",
      minLength: 1,
    },
    iss: {
      type: "string",
      minLength: 1,
    },
    vc: {
      type: "object",
    },
  },
  additionalProperties: true,
  required: ["iss", "sub", "vc"],
};
