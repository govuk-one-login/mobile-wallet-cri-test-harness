import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as jose from "jose";
import { headerSchema } from "./headerSchema";
import {
  JWK,
  JWTPayload,
  JWTVerifyResult,
  ProtectedHeaderParameters,
} from "jose";
import { payloadSchema } from "./payloadSchema";

interface Payload extends JWTPayload {
  credential_identifiers: string[];
}

export async function validatePreAuthorizedCode(
  preAuthorizedCode: string,
  jwks: JWK[],
) {
  const header: ProtectedHeaderParameters = validateHeader(preAuthorizedCode);

  console.log(header);
  console.log(jwks);

  const jwk = jwks.find((item) => item.kid === header.kid!);
  if (!jwk) {
    throw new Error("JWK NOT IN DID");
  }
  const publicKey = await jose.importJWK(jwk, header.alg);

  let verifyResult: JWTVerifyResult;
  try {
    verifyResult = await jose.jwtVerify(preAuthorizedCode, publicKey);
  } catch (error) {
    console.log(error);
    throw new Error("SIGNATURE_VEIRIFICATION_FAILED");
  }

  const payload: Payload = <Payload>validatePayload(verifyResult);
  console.log(payload);

  // validate that exp - iat is 5 mins
  return true;
}

function validateHeader(jwt: string): ProtectedHeaderParameters {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uuid"] });

  let claims: ProtectedHeaderParameters;
  try {
    claims = jose.decodeProtectedHeader(jwt);
  } catch (error) {
    console.log(error);
    throw new Error("JWT_HEADER_DECODE_ERROR");
  }

  const rulesValidator = ajv.addSchema(headerSchema).compile(headerSchema);

  if (!rulesValidator(claims)) {
    console.log(
      `Pre-authorized code header does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_HEADER");
  } else {
    return claims;
  }
}

function validatePayload(verifyResult: JWTVerifyResult): JWTPayload {
  const { payload } = verifyResult;
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uuid"] });
  const rulesValidator = ajv.addSchema(payloadSchema).compile(payloadSchema);

  if (!rulesValidator(payload)) {
    console.log(
      `Pre-authorized code payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    console.log(rulesValidator.errors);
    throw new Error("INVALID_PAYLOAD");
  } else {
    return payload;
  }
}
