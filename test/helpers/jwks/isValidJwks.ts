import { JWK } from "jose";
import Ajv from "ajv";
import { jwksSchema } from "./jwksSchema";

export interface JWKS {
  keys: JWK[];
}

export async function isValidJwks(jwks: JWKS) {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(jwksSchema).compile(jwksSchema);
  if (!rulesValidator(jwks)) {
    const message = JSON.stringify(rulesValidator.errors);
    throw new Error(
      `INVALID_JWKS: JWKS does not comply with the schema. ${message}`,
    );
  }
  return true;
}
