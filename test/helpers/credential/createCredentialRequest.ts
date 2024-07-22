import { decodeJwt, JWK } from "jose";
import { randomUUID } from "node:crypto";
import { AccessToken, createAccessToken } from "./createAccessToken";
import { createProofJwt } from "./createProofJwt";

export async function createCredentialRequest(
  preAuthorizedCode: string,
  walletSubjectId: string,
  privateKey: JWK,
  publicKey: JWK,
  nonce = randomUUID(),
): Promise<{ accessToken: AccessToken; proofJwt: string }> {
  const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

  const accessToken = await createAccessToken(
    nonce,
    walletSubjectId,
    preAuthorizedCodePayload,
    privateKey,
  );
  const proofJwt = await createProofJwt(
    nonce,
    preAuthorizedCodePayload,
    privateKey,
    publicKey,
  );

  return { accessToken, proofJwt };
}
