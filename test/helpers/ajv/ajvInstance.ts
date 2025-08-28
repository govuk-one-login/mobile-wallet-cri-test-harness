import Ajv from "ajv";
import addFormats from "ajv-formats";

let ajvInstance: Ajv | null = null;

function createAjvInstance(): Ajv {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri", "date-time", "date"] });
  ajv
    .addKeyword({
      keyword: "instanceofUint8Array",
      validate: function (schema: any, data: any) {
        if (!schema) return true;
        return data instanceof Uint8Array;
      },
      errors: false,
      type: "object",
    })
    .addKeyword({
      keyword: "instanceofMap",
      validate: function (schema: any, data: any) {
        if (!schema) return true;
        return data instanceof Map;
      },
      errors: false,
      type: "object",
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
