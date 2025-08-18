import Ajv from "ajv";
import addFormats from "ajv-formats";

let ajvInstance: Ajv | null = null;

function createAjvInstance(): Ajv {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri", "date-time", "date"] });
  // Custom keyword for Uint8Array validation
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

// Function required to reset AJV instances between unit tests
export function resetAjvInstance(): void {
  ajvInstance = null;
}
