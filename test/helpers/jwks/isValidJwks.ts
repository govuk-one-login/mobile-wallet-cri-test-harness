import {JWK} from "jose";
import Ajv from "ajv";
import {jwksSchema} from "./jwksSchema";

export type JWKS = {
  keys: JWK[];
};

export async function isValidJwks(
  jwks: JWKS,
) {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv
    .addSchema(jwksSchema)
    .compile(jwksSchema);

  if (rulesValidator(jwks)) {
    return true;
  } else {
    const message = rulesValidator.errors
      ? JSON.stringify(rulesValidator.errors)
      : "Invalid value found";
    throw new Error(`INVALID_DID_DOCUMENT: JWKS does not comply with the schema: ${message}`);
  }
}