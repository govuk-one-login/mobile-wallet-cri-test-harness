import axios from "axios";
import { JWK, JWTPayload } from "jose";
import { createAccessToken } from "./createAccessToken";
import { createDidKey, createProofJwt } from "./createProofJwt";

export async function invalidWalletSubjectId(
  preAuthorizedCodePayload: JWTPayload,
  nonce: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
  accessToken: string,
) {
  return await invalidCredentialRequestError(
    publicKey,
    nonce,
    preAuthorizedCodePayload,
    privateKey,
    accessToken,
    credentialsEndpoint,
  );
}

export async function invalidAccessTokenSignature(
  preAuthorizedCodePayload: JWTPayload,
  nonce: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  publicKey: JWK,
  accessToken: string,
) {
  return await invalidCredentialRequestError(
    publicKey,
    nonce,
    preAuthorizedCodePayload,
    privateKey,
    accessToken,
    credentialsEndpoint,
  );
}

async function invalidCredentialRequestError(
  publicKey: JWK,
  nonce: string,
  preAuthorizedCodePayload: JWTPayload,
  privateKey: JWK,
  accessToken: string,
  credentialsEndpoint: string,
) {
  const didKey = createDidKey(publicKey);
  const proofJwt = await createProofJwt(
    nonce,
    didKey,
    preAuthorizedCodePayload,
    privateKey,
  );

  try {
    await getCredential(accessToken, proofJwt, credentialsEndpoint);
  } catch (error: any) {
    if (
      error.response?.status === 400 &&
      error.response?.data === "invalid_credential_request"
    ) {
      return true;
    } else {
      console.log(
        `Error trying to fetch credential - unexpected error thrown: ${JSON.stringify(error)}`,
      );
      throw new Error("POST_CREDENTIAL_UNEXPECTED_ERROR");
    }
  }
  throw new Error("POST_CREDENTIAL_UNEXPECTED_RESPONSE");
}

export async function invalidNonce(
  preAuthorizedCodePayload: JWTPayload,
  nonce: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  walletSubjectId: string,
  proofJwt: string,
) {
  return await invalidProofError(
    nonce,
    walletSubjectId,
    preAuthorizedCodePayload,
    privateKey,
    proofJwt,
    credentialsEndpoint,
  );
}

export async function invalidProofSignature(
  preAuthorizedCodePayload: JWTPayload,
  nonce: string,
  credentialsEndpoint: string,
  privateKey: JWK,
  walletSubjectId: string,
  proofJwt: string,
) {
  return await invalidProofError(
    nonce,
    walletSubjectId,
    preAuthorizedCodePayload,
    privateKey,
    proofJwt,
    credentialsEndpoint,
  );
}

async function invalidProofError(
  nonce: string,
  walletSubjectId: string,
  preAuthorizedCodePayload: JWTPayload,
  privateKey: JWK,
  proofJwt: string,
  credentialsEndpoint: string,
) {
  const accessToken = (
    await createAccessToken(
      nonce,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKey,
    )
  ).access_token;

  try {
    await getCredential(accessToken, proofJwt, credentialsEndpoint);
  } catch (error: any) {
    if (
      error.response?.status === 400 &&
      error.response?.data === "invalid_proof"
    ) {
      return true;
    } else {
      console.log(
        `Error trying to fetch credential - unexpected error thrown: ${JSON.stringify(error)}`,
      );
      throw new Error("POST_CREDENTIAL_UNEXPECTED_ERROR");
    }
  }
  throw new Error("POST_CREDENTIAL_UNEXPECTED_RESPONSE");
}

export async function getCredential(
  accessToken: string,
  proofJwt: string,
  endpoint: string,
): Promise<boolean> {
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
}
