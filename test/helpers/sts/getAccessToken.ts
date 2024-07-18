import { randomUUID } from "node:crypto";
import { decodeJwt, importJWK, SignJWT, JWK } from "jose";
import { getKeyId } from "../../../src/config";

export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const SIGNING_ALGORITHM = "ES256";

export async function getAccessToken(
  walletSubjectId: string,
  preAuthorizedCode: string,
  signingKey: JWK,
): Promise<AccessToken> {
  const payload = decodeJwt(preAuthorizedCode);
  const signingKeyAsKeyLike = await importJWK(signingKey, SIGNING_ALGORITHM);
  const customClaims = {
    credential_identifiers: payload.credential_identifiers!,
    c_nonce: randomUUID(),
  };

  const accessToken = await new SignJWT(customClaims)
    .setProtectedHeader({ alg: SIGNING_ALGORITHM, typ: "JWT", kid: getKeyId() })
    .setSubject(walletSubjectId)
    .setIssuer(payload.aud! as string)
    .setAudience(payload.iss!)
    .sign(signingKeyAsKeyLike);

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 1800,
  };
}
