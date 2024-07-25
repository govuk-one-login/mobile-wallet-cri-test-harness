import axios, {AxiosError, AxiosResponse} from "axios";
import { randomUUID } from "node:crypto";
import * as validateCredentialErrors from "./validateCredentialErrors";

jest.mock("axios");

describe("validateCredentialErrors", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const preAuthorizedCodePayload = {
    aud: "urn:fdc:gov:uk:wallet",
    clientId: "EXAMPLE_CRI",
    iss: "urn:fdc:gov:uk:example-credential-issuer",
    credential_identifiers: ["6c8f1e22-4364-4d30-82d0-f6f45470d37a"],
    exp: 1721218838,
    iat: 1721218538,
  };
  const credentialsEndpoint = "http://example-cri.test.gov.uk/credential";
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

  describe("access token's wallet subject ID and credential offer's wallet subject ID do not match", () => {
    const nonce = randomUUID();
    const accessToken =
      "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbIjA1NmRiMzYwLWQ2MzYtNDA5Ny1iYWZhLTA3OWIwYzdhYjAzZiJdLCJjX25vbmNlIjoiMDllNDY4NDUtZjQ5Yi00ZWU1LThhZjktNTcyZGMzMzViYjExIiwic3ViIjoibm90X3RoZV9zYW1lX3dhbGxldF9zdWJqZWN0X2lkIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9fcEff2Vh4HIfNee-cQu_jtVFSZroL6fTVfhQKti3fylX9f8uU3eLso6KtDgVPjnU3fgyShAaxdwJ9ms1ko9JA";

    describe("when CRI returns 400 and 'invalid_credential_request' on invalid wallet subject ID", () => {
      it("should return true", async () => {
        const mockedError = {
          response: {
            status: 400,
            data: "invalid_credential_request",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        const result = await validateCredentialErrors.invalidWalletSubjectId(
          preAuthorizedCodePayload,
          nonce,
          credentialsEndpoint,
          privateKeyJwk,
          publicKeyJwk,
          accessToken,
        );
        expect(result).toEqual(true);
      });
    });

    describe("when CRI returns unexpected error on invalid wallet subject ID", () => {
      it("should throw POST_CREDENTIAL_UNEXPECTED_ERROR error", async () => {
        const mockedError = {
          response: {
            status: 500,
            data: "unexpected_response",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        await expect(
          validateCredentialErrors.invalidWalletSubjectId(
            preAuthorizedCodePayload,
            nonce,
            credentialsEndpoint,
            privateKeyJwk,
            publicKeyJwk,
            accessToken,
          ),
        ).rejects.toThrow("POST_CREDENTIAL_UNEXPECTED_ERROR");
      });
    });

    describe("when CRI does not return an error on invalid wallet subject ID", () => {
      it("should throw POST_CREDENTIAL_UNEXPECTED_RESPONSE error", async () => {
        const mockedResponse = {
          status: 200,
        } as AxiosResponse;
        mockedAxios.post.mockResolvedValueOnce(mockedResponse);

        await expect(
          validateCredentialErrors.invalidWalletSubjectId(
            preAuthorizedCodePayload,
            nonce,
            credentialsEndpoint,
            privateKeyJwk,
            publicKeyJwk,
            accessToken,
          ),
        ).rejects.toThrow("POST_CREDENTIAL_UNEXPECTED_RESPONSE");
      });
    });
  });

  describe("access token's signature is invalid", () => {
    const nonce = randomUUID();
    const accessToken =
      "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbIjA1NmRiMzYwLWQ2MzYtNDA5Ny1iYWZhLTA3OWIwYzdhYjAzZiJdLCJjX25vbmNlIjoiMDllNDY4NDUtZjQ5Yi00ZWU1LThhZjktNTcyZGMzMzViYjExIiwic3ViIjoidXJuOmZkYzp3YWxsZXQuYWNjb3VudC5nb3YudWs6MjAyNDpEdFBUOHgtZHBfNzN0bmxZM0tOVGlDaXR6aU45R0VoZXJEMTZicXhOdDlpIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.j_EENJ4WuPLaNn3koFr1Qd5Ieh4XX2wduAcwxMOdoFVKVa8kQ5jvXkLoKT2k3Z02t8Xrs777Kqgk5-fMKu5qnAmakeSignatureInvalid";

    describe("when CRI returns 400 and 'invalid_credential_request' on invalid access token signature", () => {
      it("should return true", async () => {
        const mockedError = {
          response: {
            status: 400,
            data: "invalid_credential_request",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        const result =
          await validateCredentialErrors.invalidAccessTokenSignature(
            preAuthorizedCodePayload,
            nonce,
            credentialsEndpoint,
            privateKeyJwk,
            publicKeyJwk,
            accessToken,
          );
        expect(result).toEqual(true);
      });
    });
  });

  describe("proof JWT's nonce does not match the access token's nonce", () => {
    const nonce = randomUUID();
    const walletSubjectId = "wallet_subject_id";
    const proofJwt =
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVkc3lxQ1BzRjRGdVQxQVNURndSdXJKcVVId21QS0pMMVVXVTd2MnZrQzNBcCJ9.eyJub25jZSI6Im5vdF90aGVfc2FtZV9ub25jZSIsImlhdCI6MTcyMTgyNTAyMywiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.0pCR6wEq2Tb7M5kfeECoO5c6nZyFmgE2P_agcKzEuvZ5b_5UwgXG8cIOZMc0qsFnP46nS8P_H63sd9axnfJbgw";

    describe("when CRI returns 400 and 'invalid_proof' on invalid nonce", () => {
      it("should return true", async () => {
        const mockedError = {
          response: {
            status: 400,
            data: "invalid_proof",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        const result = await validateCredentialErrors.invalidNonce(
          preAuthorizedCodePayload,
          nonce,
          credentialsEndpoint,
          privateKeyJwk,
          walletSubjectId,
          proofJwt,
        );
        expect(result).toEqual(true);
      });
    });

    describe("when CRI returns unexpected error on invalid nonce", () => {
      it("should throw POST_CREDENTIAL_UNEXPECTED_ERROR error", async () => {
        const mockedError = {
          response: {
            status: 400,
            data: "another_error",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        await expect(
          validateCredentialErrors.invalidNonce(
            preAuthorizedCodePayload,
            nonce,
            credentialsEndpoint,
            privateKeyJwk,
            walletSubjectId,
            proofJwt,
          ),
        ).rejects.toThrow("POST_CREDENTIAL_UNEXPECTED_ERROR");
      });
    });

    describe("when CRI does not return an error on invalid nonce", () => {
      it("should throw POST_CREDENTIAL_UNEXPECTED_RESPONSE error", async () => {
        const mockedResponse = {
          status: 200,
        } as AxiosResponse;
        mockedAxios.post.mockResolvedValueOnce(mockedResponse);

        await expect(
          validateCredentialErrors.invalidNonce(
            preAuthorizedCodePayload,
            nonce,
            credentialsEndpoint,
            privateKeyJwk,
            walletSubjectId,
            proofJwt,
          ),
        ).rejects.toThrow("POST_CREDENTIAL_UNEXPECTED_RESPONSE");
      });
    });
  });

  describe("proof JWT signature is invalid", () => {
    const nonce = randomUUID();
    const walletSubjectId = "wallet_subject_id";
    const proofJwt =
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVkc3lxQ1BzRjRGdVQxQVNURndSdXJKcVVId21QS0pMMVVXVTd2MnZrQzNBcCJ9.eyJub25jZSI6IjA5ZTQ2ODQ1LWY0OWItNGVlNS04YWY5LTU3MmRjMzM1YmIxMSIsImlhdCI6MTcyMTgyNTAyMywiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.WD2x0GIsgSSZSP5O6uCI2zcHdzvr-DZ4M5J1iJ7yK4_JodgmHPMy7AwBWL7wLFQSdFMOx7j6Jm68AiIput33yAmakeSignatureInvalid";

    describe("when CRI returns 400 and 'invalid_proof' on invalid proof JWT signature", () => {
      it("should return true", async () => {
        const mockedError = {
          response: {
            status: 400,
            data: "invalid_proof",
          },
        } as AxiosError;
        mockedAxios.post.mockRejectedValueOnce(mockedError);

        const result = await validateCredentialErrors.invalidProofSignature(
          preAuthorizedCodePayload,
          nonce,
          credentialsEndpoint,
          privateKeyJwk,
          walletSubjectId,
          proofJwt,
        );
        expect(result).toEqual(true);
      });
    });
  });
});
