import Ajv from "ajv";
import * as jose from "jose";
import { headerSchema } from "./headerSchema";
import { JWK, ProtectedHeaderParameters } from "jose";
import { payloadSchema } from "./payloadSchema";

export interface Payload {
  aud: string;
  clientId: string;
  iss: string;
  credential_identifiers: string[];
  iat: number;
  exp: number;
}

export async function validatePreAuthorizedCode(
  preAuthorizedCode: string,
  jwks: JWK[],
  criUrl: string,
  authorizationServerUrl: string,
  clientId: string,
) {
  const header: ProtectedHeaderParameters = getHeaderClaims(preAuthorizedCode);

  const verifyResult = await verifySignature(jwks, header, preAuthorizedCode);

  const payload = verifyResult.payload as unknown as Payload;

  validatePayload(payload, criUrl, authorizationServerUrl, clientId);

  return true;
}

function getHeaderClaims(jwt: string): ProtectedHeaderParameters {
  let claims: ProtectedHeaderParameters;
  try {
    claims = jose.decodeProtectedHeader(jwt);
  } catch (error) {
    console.log(`Error decoding header: ${error}`);
    throw new Error("HEADER_DECODING_ERROR");
  }

  const ajv = new Ajv({ allErrors: true, verbose: false });
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
    console.log(`Error verifying signature: ${JSON.stringify(error)}`);
    throw new Error("INVALID_SIGNATURE");
  }
}

function validatePayload(
  payload: Payload,
  criUrl: string,
  authorizationServerUrl: string,
  clientId: string,
): void {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(payloadSchema).compile(payloadSchema);
  if (!rulesValidator(payload)) {
    console.log(
      `Pre-authorized code payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const iss = payload.iss;
  if (criUrl !== iss) {
    console.log(
      `Invalid "iss" value in token. Should be "${criUrl}" but found "${iss}"`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const aud = payload.aud;
  if (authorizationServerUrl !== aud) {
    console.log(
      `Invalid "aud" value in token. Should be "${authorizationServerUrl}" but found "${aud}"`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  if (clientId !== payload.clientId) {
    console.log(
      `Invalid "clientId" value in token. Should be "${clientId}" but found "${payload.clientId}"`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const tokenIssuedAt = new Date(payload.iat * 1000);
  if (tokenIssuedAt > new Date()) {
    console.log(
      `Invalid "iat" value in token. Should be in the past but is in the future`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const tokenExpiresAt = new Date(payload.exp * 1000);
  const expiry = (tokenExpiresAt.getTime() - tokenIssuedAt.getTime()) / 60000;
  if (expiry !== 30) {
    console.log(
      `Invalid "exp" value in token. Expected 30 minute expiry but found ${expiry} minutes.
      Note: if your issuer is configured for the credential offer to be valid for a time 
      other than 30 minutes then you can change this test expectation in validatePreAuthorizedCode.ts`,
    );
    throw new Error("INVALID_PAYLOAD");
  }
}
