import { createCredentialRequest } from "./createCredentialRequest";
import * as createProofJwtModule from "./createProofJwt";
import * as createAccessTokenModule from "./createAccessToken";
import { decodeJwt } from "jose";

jest.mock("./createProofJwt", () => ({
  createProofJwt: jest.fn(),
}));

jest.mock("./createAccessToken", () => ({
  createAccessToken: jest.fn(),
}));

describe("createCredentialRequest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const createProofJwt = createProofJwtModule.createProofJwt as jest.Mock;
  createProofJwt.mockReturnValueOnce("dummyProofJwt");
  const createAccessToken =
    createAccessTokenModule.createAccessToken as jest.Mock;
  createAccessToken.mockReturnValueOnce({
    access_token: "dummyAccessToken",
    token_type: "bearer",
    expires_in: 180,
  });

  it("should return the proof JWT", async () => {
    const nonce = "e4cedcf6-1fb1-48f8-bf74-94cfbe9d0d86";
    const walletSubjectId = "wallet_subject_id";
    const preAuthorizedCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";
    const privateKeyJwk = {
      kty: "EC",
      x: "MMDgSI-XZWGzTCuPXwJerzvcvn93CJTe8ARsb0oLZw8",
      y: "VexEnyluTVBOrT_0ZOmNTl2ab9CXFTvb4BDIB93Mv7g",
      crv: "P-256",
      d: "K7DmYFhkGoXdwBROSL2mZvcNxONlhBQj5kV7yevigtk",
    };
    const publicKeyJwk = {
      kty: "EC",
      x: "UFgGaSQ8drsCJ9PsvYHMRfVQjo82iCQ2RIkfe1eWzTg",
      y: "k9AO7P3HmojHqSWM5ALd_XRGlAjHIDx_o5edrr9Wdz8",
      crv: "P-256",
    };

    const preAuthorizedCodePayload = decodeJwt(preAuthorizedCode);

    const response = await createCredentialRequest(
      preAuthorizedCode,
      walletSubjectId,
      privateKeyJwk,
      publicKeyJwk,
      nonce,
    );

    expect(response).toEqual({
      accessToken: {
        access_token: "dummyAccessToken",
        expires_in: 180,
        token_type: "bearer",
      },
      proofJwt: "dummyProofJwt",
    });
    expect(createProofJwt).toHaveBeenCalledWith(
      nonce,
      preAuthorizedCodePayload,
      privateKeyJwk,
      publicKeyJwk,
    );
    expect(createAccessToken).toHaveBeenCalledWith(
      nonce,
      walletSubjectId,
      preAuthorizedCodePayload,
      privateKeyJwk,
    );
  });
});
