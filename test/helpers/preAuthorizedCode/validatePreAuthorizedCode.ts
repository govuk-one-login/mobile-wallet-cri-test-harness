import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as jose from "jose";
import { headerSchema } from "./headerSchema";
import { JWK, JWTVerifyResult, ProtectedHeaderParameters } from "jose";
import { payloadSchema } from "./payloadSchema";
import type { JwtPayload } from "jsonwebtoken";

export async function validatePreAuthorizedCode(
  preAuthorizedCode: string,
  jwks: JWK[],
) {
  const header: ProtectedHeaderParameters = getHeaderClaims(preAuthorizedCode);

  const verifyResult = await verifySignature(jwks, header, preAuthorizedCode);

  validatePayload(verifyResult);

  return true;
}

function getHeaderClaims(jwt: string): ProtectedHeaderParameters {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uuid"] });

  let claims: ProtectedHeaderParameters;
  try {
    claims = jose.decodeProtectedHeader(jwt);
  } catch (error) {
    console.log(`Error decoding header: ${error}`);
    throw new Error("INVALID_HEADER");
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

async function verifySignature(
  jwks: JWK[],
  header: ProtectedHeaderParameters,
  preAuthorizedCode: string,
) {
  const jwk = jwks.find((item) => item.kid === header.kid!);
  if (!jwk) {
    throw new Error("JWK_NOT_IN_DID");
  }
  const publicKey = await jose.importJWK(jwk, header.alg);
  try {
    return await jose.jwtVerify(preAuthorizedCode, publicKey);
  } catch (error) {
    console.log(`Error verifying signature: ${error}`);
    throw new Error("INVALID_SIGNATURE");
  }
}

function validatePayload(verifyResult: JWTVerifyResult): void {
  const payload = verifyResult.payload as JwtPayload;
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uuid"] });
  const rulesValidator = ajv.addSchema(payloadSchema).compile(payloadSchema);

  if (!rulesValidator(payload)) {
    console.log(
      `Pre-authorized code payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const tokenExpiresAt = new Date(payload.exp!);
  const tokenIssuedAt = new Date(payload.iat!);
  const expiry = (tokenExpiresAt.getTime() - tokenIssuedAt.getTime()) / 5;
  if (expiry !== 5) {
    console.log(
      `Invalid "exp" value in token. Should be 5 minutes seconds but found ${expiry}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }
}
