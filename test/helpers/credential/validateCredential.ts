import {
  decodeProtectedHeader,
  importJWK,
  JWTPayload,
  jwtVerify,
  JWTVerifyResult,
  ProtectedHeaderParameters,
} from "jose";
import Ajv from "ajv";
import { headerSchema } from "./headerSchema";
import { payloadSchema } from "./payloadSchema";
import { VerificationMethod } from "../didDocument/validateDidDocument";

export async function validateCredential(
  credential: string,
  didKey: string,
  verificationMethods: VerificationMethod[],
  criUrl: string,
): Promise<true> {
  const header: ProtectedHeaderParameters = getHeaderClaims(credential);
  const { payload } = await verifySignature(
    verificationMethods,
    header,
    credential,
  );

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
  const verificationMethod = verificationMethods.find(
    (item) => item.id === header.kid!,
  );
  if (!verificationMethod) {
    throw new Error("PUBLIC_KEY_NOT_IN_DID");
  }
  const publicKey = await importJWK(
    verificationMethod.publicKeyJwk,
    header.alg,
  );
  try {
    return await jwtVerify(credential, publicKey);
  } catch (error) {
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

  const rulesValidator = ajv.compile(payloadSchema);
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
