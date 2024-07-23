import axios from "axios";
import { decodeJwt, JWK } from "jose";
import { createAccessToken } from "./createAccessToken";
import { createDidKey, createProofJwt } from "./createProofJwt";
import { randomUUID } from "node:crypto";

const NONCE = randomUUID();

const INVALID_CREDENTIAL_REQUEST_ERROR = "invalid_credential_request";
const INVALID_PROOF_ERROR = "invalid_proof";

export async function invalidWalletSubjectId(
  preAuthorizedCode: string,
  invalidWalletSubjectId: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
) {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessTokenWithInvalidWalletSubjectId = (
    await createAccessToken(
      NONCE,
      invalidWalletSubjectId,
      preAuthorizedCodePayload,
      privateKey,
    )
  ).access_token;

  const didKey = createDidKey(publicKey);
  const proofJwt = await createProofJwt(
    NONCE,
    didKey,
    preAuthorizedCodePayload,
    privateKey,
  );

  return await getCredentialWithError(
    accessTokenWithInvalidWalletSubjectId,
    proofJwt,
    credentialsEndpoint,
    INVALID_CREDENTIAL_REQUEST_ERROR,
  );
}

export async function invalidAccessTokenSignature(
  preAuthorizedCode: string,
  walletSubjectId: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
) {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessTokenWithInvalidSignature =
    (await createAccessToken(
      NONCE,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKey,
    )) + "makeItInvalid";

  const didKey = createDidKey(publicKey);
  const proofJwt = await createProofJwt(
    NONCE,
    didKey,
    preAuthorizedCodePayload,
    privateKey,
  );

  return await getCredentialWithError(
    accessTokenWithInvalidSignature,
    proofJwt,
    credentialsEndpoint,
    INVALID_CREDENTIAL_REQUEST_ERROR,
  );
}

export async function invalidNonce(
  preAuthorizedCode: string,
  walletSubjectId: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
) {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessToken = (
    await createAccessToken(
      NONCE,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKey,
    )
  ).access_token;

  const didKey = createDidKey(publicKey);
  const mismatchingNonce = randomUUID();
  const proofJwtWithMismatchingNonce = await createProofJwt(
    mismatchingNonce,
    didKey,
    preAuthorizedCodePayload,
    privateKey,
  );

  return await getCredentialWithError(
    accessToken,
    proofJwtWithMismatchingNonce,
    credentialsEndpoint,
    INVALID_PROOF_ERROR,
  );
}

export async function invalidProofSignature(
  preAuthorizedCode: string,
  walletSubjectId: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
) {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessToken = (
    await createAccessToken(
      NONCE,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKey,
    )
  ).access_token;

  const didKey = createDidKey(publicKey);
  const proofJwtWithInvalidSignature =
    (await createProofJwt(
      NONCE,
      didKey,
      preAuthorizedCodePayload,
      privateKey,
    )) + "makeItInvalid";

  return await getCredentialWithError(
    accessToken,
    proofJwtWithInvalidSignature,
    credentialsEndpoint,
    INVALID_PROOF_ERROR,
  );
}

export async function getCredentialWithError(
  accessToken: string,
  proofJwt: string,
  endpoint: string,
  expectedErrorMessage: string,
): Promise<boolean> {
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
  } catch (error: any) {
    if (
      error.response?.status == 400 &&
      error.response?.data == expectedErrorMessage
    ) {
      return true;
    } else {
      console.log(
        `Error trying to fetch credential - unexpected error thrown: ${JSON.stringify(error)}`,
      );
      throw new Error("POST_CREDENTIAL_UNEXPECTED_ERROR");
    }
  }
}
