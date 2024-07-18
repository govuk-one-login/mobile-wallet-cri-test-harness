import { createAccessToken } from "./createAccessToken";
import { decodeJwt, decodeProtectedHeader } from "jose";

describe("createAccessToken", () => {
  it("should return the access token", async () => {
    const walletSubjectId = "wallet_subject_id";
    const preAuthorizedCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiZTBiMDI0MzgtZDAwNi00MTAwLTkxOGEtYjAyNjI5ZTFlMjljIl0sImV4cCI6MTcyMTIyMzM5NCwiaWF0IjoxNzIxMjIzMDk0fQ.0Z7jFP8auUm_b1pnLv3RHaCFHuOpFkHlOXUtr5GJ_h4QN_MEUuSeqw8z4Rn3tgqQNQUSMtiZKCR74xqSuO2Iug";
    const privateKeyJwk = {
      kty: "EC",
      x: "MMDgSI-XZWGzTCuPXwJerzvcvn93CJTe8ARsb0oLZw8",
      y: "VexEnyluTVBOrT_0ZOmNTl2ab9CXFTvb4BDIB93Mv7g",
      crv: "P-256",
      d: "K7DmYFhkGoXdwBROSL2mZvcNxONlhBQj5kV7yevigtk",
    };

    const response = await createAccessToken(
      walletSubjectId,
      preAuthorizedCode,
      privateKeyJwk,
    );

    const accessTokenPayload = decodeJwt(response.access_token);
    const accessTokenHeader = decodeProtectedHeader(response.access_token);
    const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

    expect(response.token_type).toEqual("bearer");
    expect(response.expires_in).toEqual(180);
    expect(response.access_token).toBeTruthy();
    expect(accessTokenPayload.sub).toEqual(walletSubjectId);
    expect(accessTokenPayload.aud).toEqual(preAuthorizedCodePayload.iss);
    expect(accessTokenPayload.iss).toEqual(preAuthorizedCodePayload.aud);
    expect(accessTokenPayload.credential_identifiers).toEqual(
      preAuthorizedCodePayload.credential_identifiers,
    );
    expect(accessTokenPayload.c_nonce).toBeTruthy();
    expect(accessTokenHeader.kid).toEqual(
      "5d76b492-d62e-46f4-a3d9-bc51e8b91ac5",
    );
    expect(accessTokenHeader.typ).toEqual("JWT");
    expect(accessTokenHeader.alg).toEqual("ES256");
  });
});
