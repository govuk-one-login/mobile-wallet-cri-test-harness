import { importJWK, SignJWT, JWK, JWTPayload } from "jose";
import { getKeyId } from "../../../src/config";

export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const SIGNING_ALGORITHM = "ES256";

export async function createAccessToken(
  nonce: string,
  walletSubjectId: string,
  preAuthorizedCodePayload: JWTPayload,
  signingKey: JWK,
): Promise<AccessToken> {
  const signingKeyAsKeyLike = await importJWK(signingKey, SIGNING_ALGORITHM);
  const customClaims = {
    credential_identifiers: preAuthorizedCodePayload.credential_identifiers!,
    c_nonce: nonce,
  };

  const accessToken = await new SignJWT(customClaims)
    .setProtectedHeader({ alg: SIGNING_ALGORITHM, typ: "JWT", kid: getKeyId() })
    .setSubject(walletSubjectId)
    .setIssuer(preAuthorizedCodePayload.aud! as string)
    .setAudience(preAuthorizedCodePayload.iss!)
    .sign(signingKeyAsKeyLike);

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 180,
  };
}
