import {
  getCriDomain,
  getCriUrl,
  getCredentialOfferDeepLink,
  getWalletSubjectId,
  getClientId,
  getSelfURL,
  getDockerDnsName,
} from "../src/config";
import {
  CredentialOffer,
  extractCredentialOffer,
  parseAsJson,
  isValidCredentialOffer,
} from "./helpers/credentialOffer/isValidCredentialOffer";
import {
  getMetadata,
  Metadata,
  isValidMetadata,
} from "./helpers/metadata/isValidMetadata";
import {
  DidDocument,
  getDidDocument,
  isValidDidWebDocument,
} from "./helpers/didDocument/isValidDidWebDocument";
import { isValidPreAuthorizedCode } from "./helpers/preAuthorizedCode/isValidPreAuthorizedCode";
import { validateCredential } from "./helpers/credential/validateCredential";
import { readFileSync } from "fs";
import { decodeJwt, JWK } from "jose";
import { createAccessToken } from "./helpers/credential/createAccessToken";
import { randomUUID } from "node:crypto";
import {
  createDidKey,
  createProofJwt,
} from "./helpers/credential/createProofJwt";
import { getCredential } from "./helpers/credential/getCredential";
import axios, { AxiosError } from "axios";
import { getJwks } from "./helpers/jwks/getJwks";

let CREDENTIAL_OFFER_DEEP_LINK;
let CRI_URL;
let CRI_DOMAIN;
let WALLET_SUBJECT_ID;
let PRE_AUTHORIZED_CODE;
let PRE_AUTHORIZED_CODE_PAYLOAD;
let DID_VERIFICATION_METHOD;
let JWKS;
let CREDENTIAL_ENDPOINT;
let NOTIFICATION_ENDPOINT;
let PRIVATE_KEY_JWK;
let PUBLIC_KEY_JWK;
let NONCE;
let CLIENT_ID;
let SELF_URL;

describe("Credential Issuer Tests", () => {
  beforeAll(async () => {
    CREDENTIAL_OFFER_DEEP_LINK = getCredentialOfferDeepLink();
    CRI_URL = getCriUrl();
    CRI_DOMAIN = getCriDomain();
    WALLET_SUBJECT_ID = getWalletSubjectId();
    PRE_AUTHORIZED_CODE = extractPreAuthorizedCode(CREDENTIAL_OFFER_DEEP_LINK);
    PRE_AUTHORIZED_CODE_PAYLOAD = decodeJwt(PRE_AUTHORIZED_CODE);
    const didDocument: DidDocument = (await getDidDocument(CRI_URL)).data;
    DID_VERIFICATION_METHOD = didDocument.verificationMethod;
    const metadata: Metadata = (await getMetadata(CRI_URL)).data;
    CREDENTIAL_ENDPOINT = metadata.credential_endpoint;
    NOTIFICATION_ENDPOINT = metadata.notification_endpoint;
    PRIVATE_KEY_JWK = JSON.parse(
      readFileSync("test/helpers/credential/privateKey", "utf8"),
    ) as JWK;
    PUBLIC_KEY_JWK = JSON.parse(
      readFileSync("test/helpers/credential/publicKey", "utf8"),
    ) as JWK;
    NONCE = randomUUID();
    CLIENT_ID = getClientId();
    SELF_URL = getSelfURL();
    JWKS = (await getJwks(CRI_URL)).data.keys;
  });

  describe("Credential Offer Validation", () => {
    describe("when validating a provided credential offer", () => {
      it("should be valid credential offer", async () => {
        expect(isValidCredentialOffer(
          CREDENTIAL_OFFER_DEEP_LINK,
        )).toBe(true);
      });

      it("should be valid pre-authorized code", async () => {
        expect(await isValidPreAuthorizedCode(
          PRE_AUTHORIZED_CODE,
          JWKS,
          CRI_URL,
          SELF_URL,
          CLIENT_ID,
        )).toBe(true);
      });
    });
  });

  describe("Credential Issuer Metadata", () => {
    describe("when requesting the credential issuer metadata", () => {
      let response;

      beforeAll(async () => {
        response = await getMetadata(CRI_URL);
      });

      it("should return 200 status code", () => {
        expect(response.status).toBe(200);
      });

      it("should return JSON content", () => {
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.data).toBeTruthy();
      });

      it("should return valid metadata", async () => {
        expect(await isValidMetadata(response.data, CRI_URL, SELF_URL)).toBe(
          true,
        );
      });
    });
  });

  describe("DID Web Document", () => {
    describe("when requesting the credential issuer did:web document", () => {
      let response;

      beforeAll(async () => {
        response = await getDidDocument(CRI_URL);
      });

      it("should return 200 status code", () => {
        expect(response.status).toBe(200);
      });

      it("should return JSON content", () => {
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.data).toBeTruthy();
      });

      it("should return valid did:web document", async () => {
        expect(await isValidDidWebDocument(response.data, CRI_DOMAIN)).toBe(
          true,
        );
      });
    });
  });

  // describe("JWKS", () => {
  //   describe("when requesting the credential issuer JWKS", () => {
  //     let response;
  //
  //     beforeAll(async () => {
  //       response = await getDidDocument(CRI_URL);
  //     });
  //
  //     it("should return 200 status code", () => {
  //       expect(response.status).toBe(200);
  //     });
  //
  //     it("should return JSON content", () => {
  //       expect(response.headers['content-type']).toContain('application/json');
  //       expect(response.data).toBeTruthy();
  //     });
  //
  //     it("should return valid JWKS", async () => {
  //       expect(await isValidDidWebDocument(response.data, CRI_DOMAIN)).toBe(true);
  //     });
  //   });
  // });

  let validAccessToken;
  let validResponse;
  let validDidKey;

  describe("Credential", () => {
    describe("when requesting a credential with invalid access token", () => {
      describe("when the access token and credential offer wallet subject IDs do not match", () => {
        it("should return 401 with invalid_token error", async () => {
          const accessTokenWithInvalidWalletSubjectId = (
            await createAccessToken(
              NONCE,
              "not_the_same_wallet_subject_id",
              PRE_AUTHORIZED_CODE_PAYLOAD,
              PRIVATE_KEY_JWK,
            )
          ).access_token;

          const didKey = createDidKey(PUBLIC_KEY_JWK);
          const proofJwt = await createProofJwt(
            NONCE,
            didKey,
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );

          try {
            await getCredential(
              accessTokenWithInvalidWalletSubjectId,
              proofJwt,
              CREDENTIAL_ENDPOINT,
            );
          } catch (error) {
            expect((error as AxiosError).response?.status).toEqual(401);
            expect(
              (error as AxiosError).response?.headers["www-authenticate"],
            ).toEqual('Bearer error="invalid_token"');
          }
        });
      });

      describe("when the access token signature is invalid", () => {
        it("should return 401 with invalid_token error", async () => {
          const accessToken = (
            await createAccessToken(
              NONCE,
              WALLET_SUBJECT_ID,
              PRE_AUTHORIZED_CODE_PAYLOAD,
              PRIVATE_KEY_JWK,
            )
          ).access_token;
          const accessTokenWithInvalidSignature =
            makeSignatureInvalid(accessToken);

          const didKey = createDidKey(PUBLIC_KEY_JWK);
          const proofJwt = await createProofJwt(
            NONCE,
            didKey,
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );

          try {
            await getCredential(
              accessTokenWithInvalidSignature,
              proofJwt,
              CREDENTIAL_ENDPOINT,
            );
          } catch (error) {
            expect((error as AxiosError).response?.status).toEqual(401);
            expect(
              (error as AxiosError).response?.headers["www-authenticate"],
            ).toEqual('Bearer error="invalid_token"');
          }
        });
      });
    });

    describe("when requesting a credential with invalid proof JWT", () => {
      describe("when the proof JWT nonce does not match the access token c_nonce", () => {
        it("should return 400 with invalid_proof error", async () => {
          const proofJwtWithMismatchingNonce = await createProofJwt(
            "not_the_same_nonce",
            createDidKey(PUBLIC_KEY_JWK),
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );
          const accessToken = (
            await createAccessToken(
              NONCE,
              WALLET_SUBJECT_ID,
              PRE_AUTHORIZED_CODE_PAYLOAD,
              PRIVATE_KEY_JWK,
            )
          ).access_token;

          try {
            await getCredential(
              accessToken,
              proofJwtWithMismatchingNonce,
              CREDENTIAL_ENDPOINT,
            );
          } catch (error) {
            expect((error as AxiosError).response?.status).toEqual(400);
            expect((error as AxiosError).response?.data).toEqual({
              error: "invalid_proof",
            });
          }
        });
      });

      describe("when the proof JWT signature is invalid", () => {
        it("should return 400 with invalid_proof error", async () => {
          const proofJwt = await createProofJwt(
            NONCE,
            createDidKey(PUBLIC_KEY_JWK),
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );
          const proofJwtWithInvalidSignature = makeSignatureInvalid(proofJwt);
          const accessToken = (
            await createAccessToken(
              NONCE,
              WALLET_SUBJECT_ID,
              PRE_AUTHORIZED_CODE_PAYLOAD,
              PRIVATE_KEY_JWK,
            )
          ).access_token;

          try {
            await getCredential(
              accessToken,
              proofJwtWithInvalidSignature,
              CREDENTIAL_ENDPOINT,
            );
          } catch (error) {
            expect((error as AxiosError).response?.status).toEqual(400);
            expect((error as AxiosError).response?.data).toEqual({
              error: "invalid_proof",
            });
          }
        });
      });
    });

    describe("when requesting a credential with valid access token and proof JWT", () => {
      it("should return 200 status code", () => {
        expect(validResponse.status).toBe(200);
      });

      it("should return JSON content", () => {
        expect(validResponse.headers["content-type"]).toContain(
          "application/json",
        );
        expect(validResponse.data).toBeTruthy();
      });

      it("should return valid response body", () => {
        expect(validResponse.data.credentials).toBeTruthy();
        expect(validResponse.data.credentials.length).toEqual(1);
        expect(validResponse.data.credentials[0].credential).toBeTruthy();
      });

      it("should return notification_id when notification endpoint is supported", () => {
        if (NOTIFICATION_ENDPOINT) {
          expect(validResponse.data.notification_id).toBeTruthy();
          expect(typeof validResponse.data.notification_id).toBe("string");
        } else {
          expect(validResponse.data.notification_id).toBeUndefined();
        }
      });

      it("should return valid credential", async () => {
        beforeAll(async () => {
          validAccessToken = await createAccessToken(
            NONCE,
            WALLET_SUBJECT_ID,
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );

          validDidKey = createDidKey(PUBLIC_KEY_JWK);
          const validProofJwt = await createProofJwt(
            NONCE,
            validDidKey,
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          );

          validResponse = await getCredential(
            validAccessToken.access_token,
            validProofJwt,
            CREDENTIAL_ENDPOINT,
          );
        });

        const credential = validResponse.data.credentials[0].credential;
        const isValidCredential = await validateCredential(
          credential,
          validDidKey,
          DID_VERIFICATION_METHOD,
          CRI_URL,
        );
        expect(isValidCredential).toBe(true);
      });
    });

    describe("when attempting to redeem a credential offer twice", () => {
      it("should return 401 with invalid_token error", async () => {
        const proofJwt = await createProofJwt(
          NONCE,
          createDidKey(PUBLIC_KEY_JWK),
          PRE_AUTHORIZED_CODE_PAYLOAD,
          PRIVATE_KEY_JWK,
        );
        const accessToken = (
          await createAccessToken(
            NONCE,
            WALLET_SUBJECT_ID,
            PRE_AUTHORIZED_CODE_PAYLOAD,
            PRIVATE_KEY_JWK,
          )
        ).access_token;

        try {
          await getCredential(accessToken, proofJwt, CREDENTIAL_ENDPOINT);
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual('Bearer error="invalid_token"');
        }
      });
    });
  });

  describe("Notification Endpoint", () => {
    beforeEach(() => {
      if (!NOTIFICATION_ENDPOINT) {
        pending("Notification endpoint not implemented by this CRI");
      }
    });

    describe("when sending valid notifications", () => {
      it("should return 204 for credential_accepted event", async () => {
        const notification_id = validResponse.data.notification_id;
        const notificationResponse = await axios.post(
          getDockerDnsName(NOTIFICATION_ENDPOINT),
          {
            notification_id,
            event: "credential_accepted",
          },
          {
            headers: {
              Authorization: `Bearer ${validAccessToken.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        expect(notificationResponse.status).toBe(204);
      });

      it("should return 204 for credential_deleted event", async () => {
        const notification_id = validResponse.data.notification_id;
        const notificationResponse = await axios.post(
          getDockerDnsName(NOTIFICATION_ENDPOINT),
          {
            notification_id,
            event: "credential_deleted",
          },
          {
            headers: {
              Authorization: `Bearer ${validAccessToken.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );
        expect(notificationResponse.status).toBe(204);
      });

      it("should return 204 for credential_failure event", async () => {
        const notification_id = validResponse.data.notification_id;
        const notificationResponse = await axios.post(
          getDockerDnsName(NOTIFICATION_ENDPOINT),
          {
            notification_id,
            event: "credential_failure",
          },
          {
            headers: {
              Authorization: `Bearer ${validAccessToken.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );
        expect(notificationResponse.status).toBe(204);
      });
    });

    describe("when sending invalid notifications", () => {
      it("should return 400 for missing notification_id", async () => {
        try {
          await axios.post(
            getDockerDnsName(NOTIFICATION_ENDPOINT),
            {
              // notification_id: "invalid-id",
              event: "credential_accepted",
            },
            {
              headers: {
                Authorization: `Bearer ${validAccessToken.access_token}`,
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(400);
        }
      });

      it("should return 400 for invalid event type", async () => {
        const notification_id = validResponse.data.notification_id;
        try {
          await axios.post(
            getDockerDnsName(NOTIFICATION_ENDPOINT),
            {
              notification_id,
              event: "invalid_event",
            },
            {
              headers: {
                Authorization: `Bearer ${validAccessToken.access_token}`,
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(400);
        }
      });
    });

    describe("when sending notifications with invalid authentication", () => {
      it("should return 401 for invalid access token", async () => {
        const notification_id = validResponse.data.notification_id;
        try {
          await axios.post(
            getDockerDnsName(NOTIFICATION_ENDPOINT),
            {
              notification_id,
              event: "credential_accepted",
            },
            {
              headers: {
                Authorization: "Bearer INVALID_TOKEN",
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual('Bearer error="invalid_token"');
        }
      });

      it("should return 401 when no authentication is provided", async () => {
        const notification_id = validResponse.data.notification_id;
        try {
          await axios.post(getDockerDnsName(NOTIFICATION_ENDPOINT), {
            notification_id,
            event: "credential_accepted",
          });
          fail("Expected request to fail without authentication");
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual("Bearer");
        }
      });
    });
  });
});

function extractPreAuthorizedCode(credentialOfferDeepLink: string) {
  const credentialOffer = extractCredentialOffer(credentialOfferDeepLink);
  const preAuthorizedCode = (parseAsJson(credentialOffer!) as CredentialOffer)
    .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
    "pre-authorized_code"
  ];
  return preAuthorizedCode;
}

function makeSignatureInvalid(token: string) {
  return token + "makeSignatureInvalid";
}
