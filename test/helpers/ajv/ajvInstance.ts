import Ajv from "ajv";
import addFormats from "ajv-formats";

let ajvInstance: Ajv;

function createAjvInstance(): Ajv {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri", "date-time", "date"] });

  // Custom keyword for Buffer validation
  ajv.addKeyword({
    keyword: "instanceof",
    type: "object",
    schemaType: "string",
    compile: function (schemaValue) {
      return function validate(data) {
        if (schemaValue === "Uint8Array") {
          return data instanceof Uint8Array;
        }
        return false;
      };
    },
  });

  return ajv;
}

export function getAjvInstance(): Ajv {
  if (!ajvInstance) {
    ajvInstance = createAjvInstance();
  }
  return ajvInstance;
}
