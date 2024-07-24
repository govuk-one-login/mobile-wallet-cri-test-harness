import {
  getCriDomain,
  getCriUrl,
  getCredentialOfferDeepLink,
  getWalletSubjectId,
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
import * as validateCredentialErrors from "./helpers/credential/validateCredentialErrors";
import { createAccessToken } from "./helpers/credential/createAccessToken";
import { randomUUID } from "node:crypto";
import {
  createDidKey,
  createProofJwt,
} from "./helpers/credential/createProofJwt";

let CREDENTIAL_OFFER_DEEP_LINK;
let CRI_URL;
let CRI_DOMAIN;
let WALLET_SUBJECT_ID;
let PRE_AUTHORIZED_CODE;
let PRE_AUTHORIZED_CODE_PAYLOAD;
let DID_JWKS;
let CREDENTIALS_ENDPOINT;
let PRIVATE_KEY_JWK;
let PUBLIC_KEY_JWK;
let NONCE;

function makeSignatureInvalid(token: string) {
  return token + "makeSignatureInvalid";
}

describe("credential issuer tests", () => {
  beforeAll(async () => {
    CREDENTIAL_OFFER_DEEP_LINK = getCredentialOfferDeepLink();
    CRI_URL = getCriUrl();
    CRI_DOMAIN = getCriDomain();
    WALLET_SUBJECT_ID = getWalletSubjectId();
    PRE_AUTHORIZED_CODE = extractPreAuthorizedCode(CREDENTIAL_OFFER_DEEP_LINK);
    PRE_AUTHORIZED_CODE_PAYLOAD = decodeJwt(PRE_AUTHORIZED_CODE);
    const didDocument: DidDocument = (await getDidDocument(CRI_URL)).data;
    DID_JWKS = extractJwks(didDocument);
    CREDENTIALS_ENDPOINT = ((await getMetadata(CRI_URL)).data as Metadata)
      .credentials_endpoint;
    PRIVATE_KEY_JWK = JSON.parse(
      readFileSync("test/helpers/credential/privateKey", "utf8"),
    ) as JWK;
    PUBLIC_KEY_JWK = JSON.parse(
      readFileSync("test/helpers/credential/publicKey", "utf8"),
    ) as JWK;
    NONCE = randomUUID();
  });

  describe("successful responses", () => {
    it("should validate the credential offer", async () => {
      const isValidCredentialOffer = validateCredentialOffer(
        CREDENTIAL_OFFER_DEEP_LINK,
      );
      expect(isValidCredentialOffer).toEqual(true);
    });

    it("should validate the credential metadata", async () => {
      const isValidMetadata = await validateMetadata(CRI_URL);
      expect(isValidMetadata).toEqual(true);
    });

    it("should validate the DID document", async () => {
      const isValidDidDocument = await validateDidDocument(CRI_URL, CRI_DOMAIN);
      expect(isValidDidDocument).toEqual(true);
    });

    it("should validate the pre-authorized code", async () => {
      const isValidPreAuthorizedCode = await validatePreAuthorizedCode(
        PRE_AUTHORIZED_CODE,
        DID_JWKS,
      );
      expect(isValidPreAuthorizedCode).toEqual(true);
    });

    it("should validate the credential", async () => {
      const isValidCredential = await validateCredential(
        PRE_AUTHORIZED_CODE_PAYLOAD,
        NONCE,
        WALLET_SUBJECT_ID,
        CREDENTIALS_ENDPOINT,
        DID_JWKS,
        PRIVATE_KEY_JWK,
        PUBLIC_KEY_JWK,
      );
      expect(isValidCredential).toEqual(true);
    });
  });

  describe("unsuccessful responses", () => {
    it("should return true when the CRI returns 400 'invalid_credential_request' when the access token and the credential offer wallet subject IDs do not match", async () => {
      const accessTokenWithInvalidWalletSubjectId = (
        await createAccessToken(
          NONCE,
          "not_the_same_wallet_subject_id",
          PRE_AUTHORIZED_CODE_PAYLOAD,
          PRIVATE_KEY_JWK,
        )
      ).access_token;
      console.log(accessTokenWithInvalidWalletSubjectId);

      const isValidErrorResponse =
        await validateCredentialErrors.invalidAccessTokenSignature(
          PRE_AUTHORIZED_CODE_PAYLOAD,
          NONCE,
          CREDENTIALS_ENDPOINT,
          PRIVATE_KEY_JWK,
          PUBLIC_KEY_JWK,
          accessTokenWithInvalidWalletSubjectId,
        );
      expect(isValidErrorResponse).toEqual(true);
    });

    it("should return true when the CRI returns 400 'invalid_credential_request' when the access token signature is invalid", async () => {
      const accessToken = (
        await createAccessToken(
          NONCE,
          WALLET_SUBJECT_ID,
          PRE_AUTHORIZED_CODE_PAYLOAD,
          PRIVATE_KEY_JWK,
        )
      ).access_token;
      const accessTokenWithInvalidSignature = makeSignatureInvalid(accessToken);
      console.log(accessTokenWithInvalidSignature);

      const isValidErrorResponse =
        await validateCredentialErrors.invalidAccessTokenSignature(
          PRE_AUTHORIZED_CODE_PAYLOAD,
          NONCE,
          CREDENTIALS_ENDPOINT,
          PRIVATE_KEY_JWK,
          PUBLIC_KEY_JWK,
          accessTokenWithInvalidSignature,
        );
      expect(isValidErrorResponse).toEqual(true);
    });

    it("should return true when the CRI returns 400 'invalid_proof' when the proof JWT nonce does not match the access token c_nonce", async () => {
      const proofJwtWithMismatchingNonce = await createProofJwt(
        "not_the_same_nonce",
        createDidKey(PUBLIC_KEY_JWK),
        PRE_AUTHORIZED_CODE_PAYLOAD,
        PRIVATE_KEY_JWK,
      );
      console.log(proofJwtWithMismatchingNonce);

      const isValidErrorResponse = await validateCredentialErrors.invalidNonce(
        PRE_AUTHORIZED_CODE_PAYLOAD,
        NONCE,
        CREDENTIALS_ENDPOINT,
        PRIVATE_KEY_JWK,
        WALLET_SUBJECT_ID,
        proofJwtWithMismatchingNonce,
      );
      expect(isValidErrorResponse).toEqual(true);
    });

    it("should return true when the CRI returns 400 'invalid_proof' when the proof JWT signature is invalid", async () => {
      const proofJwt = await createProofJwt(
        NONCE,
        createDidKey(PUBLIC_KEY_JWK),
        PRE_AUTHORIZED_CODE_PAYLOAD,
        PRIVATE_KEY_JWK,
      );
      const proofJwtWithInvalidSignature = makeSignatureInvalid(proofJwt);
      console.log(proofJwtWithInvalidSignature);

      const response = await validateCredentialErrors.invalidProofSignature(
        PRE_AUTHORIZED_CODE_PAYLOAD,
        NONCE,
        CREDENTIALS_ENDPOINT,
        PRIVATE_KEY_JWK,
        WALLET_SUBJECT_ID,
        proofJwtWithInvalidSignature,
      );
      expect(response).toEqual(true);
    });
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

function extractJwks(didDocument: DidDocument) {
  const publicKeyJwks = didDocument.verificationMethod.map(
    (verificationMethod) => verificationMethod.publicKeyJwk,
  );
  return publicKeyJwks;
}
