import { createAccessToken } from "./createAccessToken";
import { decodeJwt, decodeProtectedHeader } from "jose";

describe("createAccessToken", () => {
  it("should return the access token", async () => {
    const c_nonce = "e4cedcf6-1fb1-48f8-bf74-94cfbe9d0d86";
    const walletSubjectId = "wallet_subject_id";
    const preAuthorizedCodePayload = {
      aud: "urn:fdc:gov:uk:wallet",
      clientId: "EXAMPLE_CRI",
      iss: "urn:fdc:gov:uk:example-credential-issuer",
      credential_identifiers: ["e0b02438-d006-4100-918a-b02629e1e29c"],
      exp: 1721223394,
      iat: 1721223094,
    };
    const privateKeyJwk = {
      kty: "EC",
      x: "MMDgSI-XZWGzTCuPXwJerzvcvn93CJTe8ARsb0oLZw8",
      y: "VexEnyluTVBOrT_0ZOmNTl2ab9CXFTvb4BDIB93Mv7g",
      crv: "P-256",
      d: "K7DmYFhkGoXdwBROSL2mZvcNxONlhBQj5kV7yevigtk",
    };

    const response = await createAccessToken(
      c_nonce,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKeyJwk,
    );

    const accessTokenPayload = decodeJwt(response.access_token);
    const accessTokenHeader = decodeProtectedHeader(response.access_token);

    expect(response.token_type).toEqual("bearer");
    expect(response.expires_in).toEqual(180);
    expect(response.access_token).toBeTruthy();
    expect(accessTokenPayload.sub).toEqual(walletSubjectId);
    expect(accessTokenPayload.aud).toEqual(preAuthorizedCodePayload.iss);
    expect(accessTokenPayload.iss).toEqual(preAuthorizedCodePayload.aud);
    expect(accessTokenPayload.c_nonce).toEqual(c_nonce);
    expect(accessTokenPayload.credential_identifiers).toEqual(
      preAuthorizedCodePayload.credential_identifiers,
    );
    expect(accessTokenPayload.c_nonce).toEqual(c_nonce);
    expect(accessTokenHeader.kid).toEqual(
      "5d76b492-d62e-46f4-a3d9-bc51e8b91ac5",
    );
    expect(accessTokenHeader.typ).toEqual("at+jwt");
    expect(accessTokenHeader.alg).toEqual("ES256");
  });
});
