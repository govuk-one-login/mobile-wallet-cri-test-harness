import { decodeJwt, JWK } from "jose";
import { randomUUID } from "node:crypto";
import { AccessToken, createAccessToken } from "./createAccessToken";
import { createProofJwt } from "./createProofJwt";

export async function createCredentialRequest(
  preAuthorizedCode: string,
  walletSubjectId: string,
  privateKey: JWK,
  publicKey: JWK,
): Promise<{ accessToken: AccessToken; proofJwt: string }> {
  const payload = decodeJwt(preAuthorizedCode);
  const nonce = randomUUID();

  const accessToken = await createAccessToken(
    nonce,
    walletSubjectId,
    payload,
    privateKey,
  );
  const proofJwt = await createProofJwt(nonce, payload, privateKey, publicKey);

  return { accessToken, proofJwt };
}
