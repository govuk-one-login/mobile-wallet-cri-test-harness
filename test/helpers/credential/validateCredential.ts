import {
  decodeProtectedHeader,
  importJWK,
  JWK,
  JWTPayload,
  jwtVerify,
  JWTVerifyResult,
  ProtectedHeaderParameters,
} from "jose";
import Ajv from "ajv";
import { headerSchema } from "./headerSchema";
import { payloadSchema } from "./payloadSchema";
import { createAccessToken } from "./createAccessToken";
import { createDidKey, createProofJwt } from "./createProofJwt";
import { getCredential } from "./getCredential";
import {VerificationMethod} from "../didDocument/validateDidDocument";

export async function validateCredential(
  preAuthorizedCodePayload: JWTPayload,
  nonce: string,
  walletSubjectId: string,
  credentialEndpoint: string,
  verificationMethod: VerificationMethod[],
  privateKey: JWK,
  publicKey: JWK,
  criUrl: string,
): Promise<true> {
  const accessToken = await createAccessToken(
    nonce,
    walletSubjectId,
    preAuthorizedCodePayload,
    privateKey,
  );

  const didKey = createDidKey(publicKey);
  const proofJwt = await createProofJwt(
    nonce,
    didKey,
    preAuthorizedCodePayload,
    privateKey,
  );

  let response;
  try {
    response = await getCredential(
      accessToken.access_token,
      proofJwt,
      credentialEndpoint,
    );
  } catch (error) {
    console.log(`Error trying to fetch credential: ${JSON.stringify(error)}`);
    throw new Error("POST_CREDENTIAL_ERROR");
  }

  if (response.status !== 200) {
    throw new Error("INVALID_STATUS_CODE");
  }

  const credential = response.data?.credential;
  if (!credential) {
    throw new Error("INVALID_RESPONSE_DATA");
  }

  const header: ProtectedHeaderParameters = getHeaderClaims(credential);

  const { payload } = await verifySignature(verificationMethod, header, credential);

  validatePayload(payload, didKey, criUrl);

  return true;
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
  verificationMethods: VerificationMethod[],
  header: ProtectedHeaderParameters,
  credential: string,
): Promise<JWTVerifyResult> {
  const verificationMethod = verificationMethods.find((item) => item.id === header.kid!);
  if (!verificationMethod) {
    throw new Error("VERIFICATION_METHOD_NOT_IN_DID");
  }
  const publicKey = await importJWK(verificationMethod.publicKeyJwk, header.alg);
  try {
    return await jwtVerify(credential, publicKey);
  } catch (error) {
    console.info(error);
    console.log(`Error verifying signature: ${JSON.stringify(error)}`);
    throw new Error("INVALID_SIGNATURE");
  }
}

function validatePayload(
  payload: JWTPayload,
  didKey: string,
  criUrl: string,
): void {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(payloadSchema).compile(payloadSchema);
  if (!rulesValidator(payload)) {
    console.log(
      `Credential payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_PAYLOAD");
  }

  const iss = payload.iss;
  if (criUrl !== iss) {
    console.log(
      `Invalid "iss" value in token. Should be ${criUrl} but found ${iss}`,
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
