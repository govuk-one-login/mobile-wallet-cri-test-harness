import { validateCredential } from "./validateCredential";
import * as createProofJwtModule from "./createProofJwt";
import * as createAccessTokenModule from "./createAccessToken";
import axios, { AxiosResponse } from "axios";
import { randomUUID } from "node:crypto";
import { importJWK, SignJWT } from "jose";

jest.mock("axios");
jest.mock("./createProofJwt", () => ({
  createProofJwt: jest.fn(),
  createDidKey: jest.fn(),
}));
jest.mock("./createAccessToken", () => ({
  createAccessToken: jest.fn(),
}));
console.log = jest.fn();

const criUrl = "https://test-example-cri.gov.uk";
const kid = "did:web:test-example-cri.gov.uk#78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274";
const proofJwt =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA";
const accessToken = {
  access_token:
    "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
  token_type: "bearer",
  expires_in: 180,
};
const nonce = randomUUID();
const walletSubjectId = "wallet_subject_id";
const preAuthorizedCodePayload = {
  aud: "urn:fdc:gov:uk:wallet",
  clientId: "EXAMPLE_CRI",
  iss: "urn:fdc:gov:uk:example-credential-issuer",
  credential_identifiers: ["6c8f1e22-4364-4d30-82d0-f6f45470d37a"],
  exp: 1721218838,
  iat: 1721218538,
};
const credentialEndpoint = "http://example-cri.test.gov.uk/credential";
const verificationMethod = [{
  id: "did:web:test-example-cri.gov.uk#78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
  type: "JsonWebKey2020",
  controller: "did:web:test-example-cri.gov.uk",
  publicKeyJwk:
      {
        alg: "ES256",
        kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
        kty: "EC",
        x: "-OxU7o3ZtHJ7GnufJkGKv3EAgeisXdZg1eTKErzsiL8",
        y: "1yKvdIgdktb6MYaVU2Ptt_yrnU1Y5gmT2uJbc9q4vGg",
        crv: "P-256",
      },
}];
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
const didKey = "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c";

describe("validateCredential", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const createProofJwt = createProofJwtModule.createProofJwt as jest.Mock;
  const createAccessToken =
    createAccessTokenModule.createAccessToken as jest.Mock;
  const createDidKey = createProofJwtModule.createDidKey as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-08-01T09:08:24.000Z"));
    createProofJwt.mockReturnValue(proofJwt);
    createAccessToken.mockReturnValue(accessToken);
    createDidKey.mockReturnValue(didKey);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 'true' when credential is valid", async () => {
    const credential = await getTestJwt(criUrl, kid, didKey);
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    expect(
      await validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).toEqual(true);
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const credential = await getTestJwt(criUrl, kid, didKey);
    const mockedResponse = {
      status: 201,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 201,
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'HEADER_DECODING_ERROR' error when token header cannot be decoded", async () => {
    const credential =
      "invalidHeader" + (await getTestJwt(criUrl, kid, didKey));
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("HEADER_DECODING_ERROR");
  });

  it("should throw 'INVALID_HEADER' error when header is missing 'kid' claim", async () => {
    const credential = await getTestJwt(criUrl, undefined, didKey);
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_HEADER");
  });

  it("should throw 'PUBLIC_KEY_NOT_IN_DID' error when when public key is not in the DID document", async () => {
    const credential = await getTestJwt(criUrl, "did:web:test-example-cri.gov.uk#11fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032059645", didKey);
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const verificationMethod = [{
      id: "did:web:test-example-cri.gov.uk#78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
      type: "JsonWebKey2020",
      controller: "did:web:test-example-cri.gov.uk",
      publicKeyJwk:
          {
            alg: "ES256",
            kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
            kty: "EC",
            x: "oU5Xs7sFXCckKMKGAiRMhv1q7RWqlYTl80Voqi1kZow",
            y: "mXADd0XOLEtq8mk2mP0qhdDnS0hIUjQJZ4fJ1Df3Cvo",
            crv: "P-256",
          },
    }];

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("PUBLIC_KEY_NOT_IN_DID");
  });

  it("should throw 'INVALID_SIGNATURE' when signature cannot be verified", async () => {
    const credential = await getTestJwt(criUrl, kid, didKey);
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const verificationMethod = [{
      id: "did:web:test-example-cri.gov.uk#78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
      type: "JsonWebKey2020",
      controller: "did:web:test-example-cri.gov.uk",
      publicKeyJwk:
          {
            alg: "ES256",
            kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
            kty: "EC",
            x: "oU5Xs7sFXCckKMKGAiRMhv1q7RWqlYTl80Voqi1kZow",
            y: "mXADd0XOLEtq8mk2mP0qhdDnS0hIUjQJZ4fJ1Df3Cvo",
            crv: "P-256",
          },
    }];

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_SIGNATURE");
  });

  it("should throw 'INVALID_PAYLOAD' error when payload is missing 'issuer' claim", async () => {
    const credential = await getTestJwt(undefined, kid, didKey);
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Credential payload does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"iss"},"message":"must have required property \'iss\'"}]',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when 'sub' value is not ", async () => {
    const credential = await getTestJwt(
      criUrl,
      kid,
      "did:key:zDnaecBLbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehP8d",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential: credential,
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCodePayload,
        nonce,
        walletSubjectId,
        credentialEndpoint,
        verificationMethod,
        privateKeyJwk,
        publicKeyJwk,
        criUrl,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "sub" value in token. Should be did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c but found did:key:zDnaecBLbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehP8d',
    );
  });
});

async function getTestJwt(issuer, kid, sub) {
  const privateKey = {
    kty: "EC",
    x: "-OxU7o3ZtHJ7GnufJkGKv3EAgeisXdZg1eTKErzsiL8",
    y: "1yKvdIgdktb6MYaVU2Ptt_yrnU1Y5gmT2uJbc9q4vGg",
    crv: "P-256",
    d: "uhF3qwj2ddRwnWO84tCS-qJEsm7m__bAG5x6klw-rng",
  };
  const signingKeyAsKeyLike = await importJWK(privateKey, "ES256");

  return await new SignJWT({
    iss: "https://test-example-cri.gov.uk",
    sub: sub,
    nbf: 1721731169,
    exp: 1754060904,
    "@context": ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"],
    type: ["VerifiableCredential", "digitalVeteranCard"],
    issuer: "https://test-example-cri.gov.uk",
    name: "Veteran's Card",
    description: "issuer-specified credential description",
    validFrom: "2024-04-09T12:12:11Z",
    validUntil: "2034-04-08T22:59:59Z",
    credentialSubject: { id: sub },
  })
    .setProtectedHeader({ alg: "ES256", typ: "vc+jwt", cty: "vc", kid: kid })
    .setIssuedAt(1721731169)
    .setExpirationTime("1year")
    .setIssuer(issuer)
    .setNotBefore(1721731169)
    .sign(signingKeyAsKeyLike);
}
