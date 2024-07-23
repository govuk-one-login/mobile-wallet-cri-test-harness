export const headerSchema = {
  type: "object",
  properties: {
    kid: {
      type: "string",
      minLength: 1,
    },
  },
  additionalProperties: true,
  required: ["kid"],
};
