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
  getCredentialOffer,
  parseAsJson,
  validateCredentialOffer,
} from "./helpers/credentialOffer/validateCredentialOffer";
import {
  getMetadata,
  Metadata,
  validateMetadata,
} from "./helpers/metadata/validateMetadata";
import {
  DidDocument,
  getDidDocument,
  validateDidDocument,
} from "./helpers/didDocument/validateDidDocument";
import { validatePreAuthorizedCode } from "./helpers/preAuthorizedCode/validatePreAuthorizedCode";
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

describe("credential issuer tests", () => {
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

  it("should return 401 and 'invalid_token' when the access token and the credential offer wallet subject IDs do not match", async () => {
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

  it("should return 401 and 'invalid_token' when the access token signature is invalid", async () => {
    const accessToken = (
      await createAccessToken(
        NONCE,
        WALLET_SUBJECT_ID,
        PRE_AUTHORIZED_CODE_PAYLOAD,
        PRIVATE_KEY_JWK,
      )
    ).access_token;
    const accessTokenWithInvalidSignature = makeSignatureInvalid(accessToken);
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

  it("should return 400 and 'invalid_proof' when the proof JWT nonce does not match the access token c_nonce", async () => {
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

  it("should return 400 and 'invalid_proof' when the proof JWT signature is invalid", async () => {
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

  it("should validate the credential offer", async () => {
    const isValidCredentialOffer = validateCredentialOffer(
      CREDENTIAL_OFFER_DEEP_LINK,
    );
    expect(isValidCredentialOffer).toEqual(true);
  });

  it("should validate the credential metadata", async () => {
    const isValidMetadata = await validateMetadata(CRI_URL, SELF_URL);
    expect(isValidMetadata).toEqual(true);
  });

  it("should validate the DID document", async () => {
    const isValidDidDocument = await validateDidDocument(CRI_URL, CRI_DOMAIN);
    expect(isValidDidDocument).toEqual(true);
  });

  it("should validate the pre-authorized code", async () => {
    const isValidPreAuthorizedCode = await validatePreAuthorizedCode(
      PRE_AUTHORIZED_CODE,
      JWKS,
      CRI_URL,
      SELF_URL,
      CLIENT_ID,
    );
    expect(isValidPreAuthorizedCode).toEqual(true);
  });

  describe("should validate the credential and return 200", () => {
    let accessToken;
    let response;
    let didKey;

    beforeAll(async () => {
      accessToken = await createAccessToken(
        NONCE,
        WALLET_SUBJECT_ID,
        PRE_AUTHORIZED_CODE_PAYLOAD,
        PRIVATE_KEY_JWK,
      );

      didKey = createDidKey(PUBLIC_KEY_JWK);
      const proofJwt = await createProofJwt(
        NONCE,
        didKey,
        PRE_AUTHORIZED_CODE_PAYLOAD,
        PRIVATE_KEY_JWK,
      );

      response = await getCredential(
        accessToken.access_token,
        proofJwt,
        CREDENTIAL_ENDPOINT,
      );
    });

    it("should validate the credential response", async () => {
      expect(response.status).toBe(200);
      if (NOTIFICATION_ENDPOINT) {
        expect(response.data.notification_id).toBeTruthy();
      } else {
        expect(response.data.notification_id).toBeFalsy();
      }
      expect(response.data.credentials).toBeTruthy();
      expect(response.data.credentials.length).toEqual(1);
      const credential = response.data.credentials[0].credential;
      expect(credential).toBeTruthy();
      const isValidCredential = await validateCredential(
        credential,
        didKey,
        DID_VERIFICATION_METHOD,
        CRI_URL,
      );
      expect(isValidCredential).toBe(true);
    });

    it("should return 204 when a valid 'credential_accepted' notification is sent", async () => {
      if (!NOTIFICATION_ENDPOINT) {
        console.log("CRI doesn't implement a notification endpoint");
      } else {
        const notification_id = response.data.notification_id;
        const notificationResponse = await axios.post(
          getDockerDnsName(NOTIFICATION_ENDPOINT),
          {
            notification_id,
            event: "credential_accepted",
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken.access_token}`,
            },
          },
        );
        expect(notificationResponse.status).toBe(204);
      }
    });

    it("should return 401 and 'invalid_token' when the 'credential_accepted' notification contains an invalid access token", async () => {
      if (!NOTIFICATION_ENDPOINT) {
        console.log("CRI doesn't implement a notification endpoint");
      } else {
        const notification_id = response.data.notification_id;
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
              },
            },
          );
        } catch (error) {
          console.log(error);
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual('Bearer error="invalid_token"');
        }
      }
    });

    it("should return 401 when the 'credential_accepted' notification does not contain authentication", async () => {
      if (!NOTIFICATION_ENDPOINT) {
        console.log("CRI doesn't implement a notification endpoint");
      } else {
        const notification_id = response.data.notification_id;
        try {
          await axios.post(getDockerDnsName(NOTIFICATION_ENDPOINT), {
            notification_id,
            event: "credential_accepted",
          });
        } catch (error) {
          console.log(error);
          expect((error as AxiosError).response?.status).toEqual(401);
          expect(
            (error as AxiosError).response?.headers["www-authenticate"],
          ).toEqual("Bearer");
        }
      }
    });
  });

  it("should return 401 and 'invalid_token' when the credential offer is redeemed a second time", async () => {
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

function extractPreAuthorizedCode(credentialOfferDeepLink: string) {
  const credentialOffer = getCredentialOffer(credentialOfferDeepLink);
  const preAuthorizedCode = (parseAsJson(credentialOffer!) as CredentialOffer)
    .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
    "pre-authorized_code"
  ];
  return preAuthorizedCode;
}

function makeSignatureInvalid(token: string) {
  return token + "makeSignatureInvalid";
}
