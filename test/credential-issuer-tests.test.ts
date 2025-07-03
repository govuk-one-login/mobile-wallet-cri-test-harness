import {
  getClientId,
  getCredentialOfferDeepLink,
  getCredentialFormat,
  getCriDomain,
  getCriUrl,
  getSelfURL,
  getWalletSubjectId,
} from "../src/config";
import {
  CredentialOffer,
  extractCredentialOffer,
  isValidCredentialOffer,
  parseAsJson,
} from "./helpers/credentialOffer/isValidCredentialOffer";
import { isValidMetadata, Metadata } from "./helpers/metadata/isValidMetadata";
import {
  DidDocument,
  isValidDidWebDocument,
} from "./helpers/didDocument/isValidDidWebDocument";
import { isValidPreAuthorizedCode } from "./helpers/preAuthorizedCode/isValidPreAuthorizedCode";
import { isValidCredential } from "./helpers/credential/isValidCredential";
import { readFileSync } from "fs";
import { decodeJwt, JWK } from "jose";
import { createAccessToken } from "./helpers/credential/createAccessToken";
import { randomUUID } from "node:crypto";
import {
  createDidKey,
  createProofJwt,
} from "./helpers/credential/createProofJwt";
import { AxiosError } from "axios";
import { isValidJwks } from "./helpers/jwks/isValidJwks";
import {
  getCredential,
  getDidDocument,
  getJwks,
  getMetadata,
  sendNotification,
} from "./helpers/api/api";

// Helper function to determine if a test should run
const shouldRun = (types: string[]) => types.includes(getCredentialFormat());
const JWT_ONLY = ["jwt"];
const MDOC_ONLY = ["mdoc"];
const JWT_AND_MDOC = ["jwt", "mdoc"];

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
let ACCESS_TOKEN;
let CREDENTIAL_RESPONSE;
let DID_KEY;

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
    // The following are required for happy path credential test:
    ACCESS_TOKEN = await createAccessToken(
      NONCE,
      WALLET_SUBJECT_ID,
      PRE_AUTHORIZED_CODE_PAYLOAD,
      PRIVATE_KEY_JWK,
    );
    DID_KEY = createDidKey(PUBLIC_KEY_JWK);
    const PROOF_JWT = await createProofJwt(
      NONCE,
      DID_KEY,
      PRE_AUTHORIZED_CODE_PAYLOAD,
      PRIVATE_KEY_JWK,
    );
    CREDENTIAL_RESPONSE = await getCredential(
      ACCESS_TOKEN.access_token,
      PROOF_JWT,
      CREDENTIAL_ENDPOINT,
    );
  });

  (shouldRun(JWT_AND_MDOC) ? describe : describe.skip)(
    "Credential Offer",
    () => {
      describe("when validating a provided credential offer", () => {
        it("should be valid credential offer", async () => {
          expect(isValidCredentialOffer(CREDENTIAL_OFFER_DEEP_LINK)).toBe(true);
        });
        it("should be valid pre-authorized code", async () => {
          expect(
            await isValidPreAuthorizedCode(
              PRE_AUTHORIZED_CODE,
              JWKS,
              CRI_URL,
              SELF_URL,
              CLIENT_ID,
            ),
          ).toBe(true);
        });
      });
    },
  );

  (shouldRun(JWT_AND_MDOC) ? describe : describe.skip)("Metadata", () => {
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

  (shouldRun(JWT_ONLY) ? describe : describe.skip)("did:web Document", () => {
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

  (shouldRun(MDOC_ONLY) ? describe : describe.skip)("IACAs", () => {
    describe("when requesting the credential issuer IACAs", () => {
      it("should be true", () => {
        expect(true).toBe(true);
      });
    });
  });

  (shouldRun(JWT_AND_MDOC) ? describe : describe.skip)("JWKS", () => {
    describe("when requesting the credential issuer JWKS", () => {
      let response;

      beforeAll(async () => {
        response = await getJwks(CRI_URL);
      });

      it("should return 200 status code", () => {
        expect(response.status).toBe(200);
      });

      it("should return JSON content", () => {
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.data).toBeTruthy();
      });

      it("should return valid JWKS", async () => {
        expect(await isValidJwks(response.data)).toBe(true);
      });
    });
  });

  (shouldRun(JWT_AND_MDOC) ? describe : describe.skip)("Credential", () => {
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
        expect(CREDENTIAL_RESPONSE.status).toBe(200);
      });

      it("should return JSON content", () => {
        expect(CREDENTIAL_RESPONSE.headers["content-type"]).toContain(
          "application/json",
        );
        expect(CREDENTIAL_RESPONSE.data).toBeTruthy();
      });

      it("should return valid response body", () => {
        expect(CREDENTIAL_RESPONSE.data.credentials).toBeTruthy();
        expect(CREDENTIAL_RESPONSE.data.credentials.length).toEqual(1);
        expect(CREDENTIAL_RESPONSE.data.credentials[0].credential).toBeTruthy();
      });

      it("should return notification_id when notification endpoint is supported", () => {
        if (NOTIFICATION_ENDPOINT) {
          expect(CREDENTIAL_RESPONSE.data.notification_id).toBeTruthy();
          expect(typeof CREDENTIAL_RESPONSE.data.notification_id).toBe(
            "string",
          );
        } else {
          expect(CREDENTIAL_RESPONSE.data.notification_id).toBeUndefined();
        }
      });

      it("should return valid credential", async () => {
        const credential = CREDENTIAL_RESPONSE.data.credentials[0].credential;
        expect(
          await isValidCredential(
            credential,
            DID_KEY,
            DID_VERIFICATION_METHOD,
            CRI_URL,
          ),
        ).toBe(true);
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

  (shouldRun(JWT_AND_MDOC) ? describe : describe.skip)("Notification", () => {
    beforeEach(() => {
      if (!NOTIFICATION_ENDPOINT) {
        pending("Notification endpoint not implemented by this CRI");
      }
    });

    describe("when sending valid notifications", () => {
      it("should return 204 for credential_accepted event", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        const notificationResponse = await sendNotification(
          ACCESS_TOKEN.access_token,
          notification_id,
          "credential_accepted",
          NOTIFICATION_ENDPOINT,
        );
        expect(notificationResponse.status).toBe(204);
      });

      it("should return 204 for credential_deleted event", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        const notificationResponse = await sendNotification(
          ACCESS_TOKEN.access_token,
          notification_id,
          "credential_deleted",
          NOTIFICATION_ENDPOINT,
        );

        expect(notificationResponse.status).toBe(204);
      });

      it("should return 204 for credential_failure event", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        const notificationResponse = await sendNotification(
          ACCESS_TOKEN.access_token,
          notification_id,
          "credential_failure",
          NOTIFICATION_ENDPOINT,
        );

        expect(notificationResponse.status).toBe(204);
      });
    });

    describe("when sending invalid notifications", () => {
      it("should return 400 for missing notification_id", async () => {
        try {
          await sendNotification(
            ACCESS_TOKEN.access_token,
            undefined,
            "credential_failure",
            NOTIFICATION_ENDPOINT,
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(400);
        }
      });

      it("should return 400 for invalid event type", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        try {
          await sendNotification(
            ACCESS_TOKEN.access_token,
            notification_id,
            "invalid_event",
            NOTIFICATION_ENDPOINT,
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(400);
        }
      });
    });

    describe("when sending notifications with invalid authentication", () => {
      it("should return 401 for invalid access token", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        try {
          await sendNotification(
            "INVALID_TOKEN",
            notification_id,
            "credential_accepted",
            NOTIFICATION_ENDPOINT,
          );
        } catch (error) {
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual('Bearer error="invalid_token"');
        }
      });

      it("should return 401 when no authentication is provided", async () => {
        const notification_id = CREDENTIAL_RESPONSE.data.notification_id;
        try {
          await sendNotification(
            undefined,
            notification_id,
            "credential_accepted",
            NOTIFICATION_ENDPOINT,
          );
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
  return (parseAsJson(credentialOffer!) as CredentialOffer).grants[
    "urn:ietf:params:oauth:grant-type:pre-authorized_code"
  ]["pre-authorized_code"];
}

function makeSignatureInvalid(token: string) {
  return token + "makeSignatureInvalid";
}
