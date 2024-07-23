import axios, { AxiosResponse } from "axios";
import {
  decodeJwt,
  decodeProtectedHeader,
  importJWK,
  JWK,
  JWTPayload,
  jwtVerify,
  ProtectedHeaderParameters,
} from "jose";
import Ajv from "ajv";
import { headerSchema } from "./headerSchema";
import { payloadSchema } from "./payloadSchema";
import { readFileSync } from "fs";
import { createAccessToken } from "./createAccessToken";
import { createDidKey, createProofJwt } from "./createProofJwt";
import { randomUUID } from "node:crypto";

const PRIVATE_KEY = JSON.parse(
  readFileSync("test/helpers/credential/privateKey", "utf8"),
) as JWK;
const PUBLIC_KEY = JSON.parse(
  readFileSync("test/helpers/credential/publicKey", "utf8"),
) as JWK;
const NONCE = randomUUID();

export async function validateCredential(
  preAuthorizedCode: string,
  walletSubjectId: string,
  credentialsEndpoint: string,
  jwks: JWK[],
) {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessToken = await createAccessToken(
    NONCE,
    walletSubjectId,
    preAuthorizedCodePayload,
    PRIVATE_KEY,
  );

  const didKey = createDidKey(PUBLIC_KEY);

  const proofJwt = await createProofJwt(
    NONCE,
    didKey,
    preAuthorizedCodePayload,
    PRIVATE_KEY,
  );

  const response = await getCredential(
    accessToken.access_token,
    proofJwt,
    credentialsEndpoint,
  );

  if (response.status !== 200) {
    throw new Error("INVALID_STATUS_CODE");
  }

  const credential = response.data?.credential;
  if (!credential) {
    throw new Error("INVALID_RESPONSE_DATA");
  }

  const header: ProtectedHeaderParameters = getHeaderClaims(credential);

  const { payload } = await verifySignature(jwks, header, credential);

  validatePayload(payload, didKey);

  return true;
}

export async function getCredential(
  accessToken: string,
  proofJwt: string,
  endpoint: string,
): Promise<AxiosResponse> {
  try {
    // When running the CRI and test harness locally, replace domain "localhost" with "host.docker.internal" before making the request
    endpoint = endpoint.replace("localhost", "host.docker.internal");
    const credentialUrl = new URL(endpoint).toString();

    return await axios.post(
      credentialUrl,
      {
        proof: {
          proof_type: "jwt",
          jwt: proofJwt,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (error) {
    console.log(`Error trying to fetch credential: ${JSON.stringify(error)}`);
    throw new Error("POST_CREDENTIAL_ERROR");
  }
}

function getHeaderClaims(jwt: string): ProtectedHeaderParameters {
  let claims: ProtectedHeaderParameters;
  try {
    claims = decodeProtectedHeader(jwt);
  } catch (error) {
    console.log(`Error decoding header: ${error}`);
    throw new Error("HEADER_DECODING_ERROR");
  }

  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(headerSchema).compile(headerSchema);
  if (!rulesValidator(claims)) {
    console.log(
      `Credential header does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
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
  const publicKey = await importJWK(jwk, header.alg);
  try {
    return await jwtVerify(preAuthorizedCode, publicKey);
  } catch (error) {
    console.log(`Error verifying signature: ${JSON.stringify(error)}`);
    throw new Error("INVALID_SIGNATURE");
  }
}

function validatePayload(payload: JWTPayload, didKey: string): void {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(payloadSchema).compile(payloadSchema);
  if (!rulesValidator(payload)) {
    console.log(
      `Credential payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const sub = payload.sub;
  if (didKey !== sub) {
    console.log(
      `Invalid "sub" value in token. Should be ${didKey} but found ${sub}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }
}
