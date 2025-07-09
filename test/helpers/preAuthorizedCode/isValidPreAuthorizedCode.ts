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

const EXPECTED_TOKEN_DURATION_MINUTES = 30;

export async function isValidPreAuthorizedCode(
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
    throw new Error(
      `INVALID_HEADER: Failed to decode pre-authorized code header. ${error}`,
    );
  }

  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(headerSchema).compile(headerSchema);
  if (!rulesValidator(claims)) {
    throw new Error(
      `INVALID_HEADER: Pre-authorized code header does not comply with the schema. ${JSON.stringify(rulesValidator.errors)}`,
    );
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
    throw new Error(
      "INVALID_SIGNATURE: JWK not found in JWKS for provided 'kid'",
    );
  }
  const publicKey = await jose.importJWK(jwk, header.alg);
  try {
    return await jose.jwtVerify(preAuthorizedCode, publicKey);
  } catch (error) {
    throw new Error(
      `INVALID_SIGNATURE: Pre-authorized code verification failed. ${JSON.stringify(error)}`,
    );
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
    throw new Error(
      `INVALID_PAYLOAD: Pre-authorized code payload does not comply with the schema. ${JSON.stringify(rulesValidator.errors)}`,
    );
  }

  const iss = payload.iss;
  if (criUrl !== iss) {
    throw new Error(
      `INVALID_PAYLOAD: Invalid "iss" value in token. Should be "${criUrl}" but found "${iss}"`,
    );
  }

  const aud = payload.aud;
  if (authorizationServerUrl !== aud) {
    throw new Error(
      `INVALID_PAYLOAD: Invalid "aud" value in token. Should be "${authorizationServerUrl}" but found "${aud}"`,
    );
  }

  if (clientId !== payload.clientId) {
    throw new Error(
      `INVALID_PAYLOAD: Invalid "clientId" value in token. Should be "${clientId}" but found "${payload.clientId}"`,
    );
  }

  const issuedAt = epochSecondsToDate(payload.iat);
  const currentTime = new Date();
  if (issuedAt > currentTime) {
    throw new Error(
      `"INVALID_PAYLOAD: Invalid "iat" value in token. Should be in the past but is in the future`,
    );
  }

  const expirationTime = epochSecondsToDate(payload.exp);
  const actualTokenDurationMinutes = getDurationInMinutes(
    issuedAt,
    expirationTime,
  );
  if (actualTokenDurationMinutes !== EXPECTED_TOKEN_DURATION_MINUTES) {
    console.log(
      `Note: If your issuer is configured for the credential offer to be valid for a time other than 
      ${EXPECTED_TOKEN_DURATION_MINUTES} minutes, update EXPECTED_TOKEN_DURATION_MINUTES in this validation code.`,
    );

    throw new Error(
      `INVALID_PAYLOAD: Invalid "exp" value in token. ` +
        `Expected ${EXPECTED_TOKEN_DURATION_MINUTES} minute expiry but found ${actualTokenDurationMinutes} minutes`,
    );
  }
}

// Helper function to convert epoch seconds to Date
function epochSecondsToDate(epochSeconds) {
  const millisecondsPerSecond = 1000;
  return new Date(epochSeconds * millisecondsPerSecond);
}

// Helper function to calculate duration in minutes between two dates
function getDurationInMinutes(startDate, endDate) {
  const millisecondsPerMinute = 60000;
  return (endDate.getTime() - startDate.getTime()) / millisecondsPerMinute;
}
