import axios, {AxiosResponse} from "axios";
import {getDockerDnsName} from "../../../src/config";
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

export async function getJwks(criUrl): Promise<AxiosResponse> {
  const JWKS_PATH: string = ".well-known/jwks.json";
  try {
    const jwksUrl = new URL(JWKS_PATH, criUrl).toString();
    return await axios.get(getDockerDnsName(jwksUrl));
  } catch (error) {
    console.log(`Error trying to fetch jwks: ${JSON.stringify(error)}`);
    throw new Error("GET_JWKS_ERROR");
  }
}
