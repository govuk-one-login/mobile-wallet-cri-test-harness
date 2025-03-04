import {
  getCriDomain,
  getCriUrl,
  getCredentialOfferDeepLink,
  getWalletSubjectId,
  getClientId,
  getSelfURL,
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
import { AxiosError } from "axios";
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
    CREDENTIAL_ENDPOINT = ((await getMetadata(CRI_URL)).data as Metadata)
      .credential_endpoint;
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

  it("should return 400 and 'invalid_credential_request' when the access token and the credential offer wallet subject IDs do not match", async () => {
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
      expect((error as AxiosError).response?.status).toEqual(400);
      expect((error as AxiosError).response?.data).toEqual({
        error: "invalid_credential_request",
      });
    }
  });

  it("should return 400 and 'invalid_credential_request' when the access token signature is invalid", async () => {
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
      expect((error as AxiosError).response?.status).toEqual(400);
      expect((error as AxiosError).response?.data).toEqual({
        error: "invalid_credential_request",
      });
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

  // THIS TEST WILL FAIL WITH AN "INVALID_HEADER" ERROR UNTIL THE "KID" IN THE CREDENTIAL HEADER IS UPDATED TO FOLLOW THE PATTERN "^did:web:[a-z0-9.#\\-_]+$"
  it("should validate the credential", async () => {
    const isValidCredential = await validateCredential(
      PRE_AUTHORIZED_CODE_PAYLOAD,
      NONCE,
      WALLET_SUBJECT_ID,
      CREDENTIAL_ENDPOINT,
      DID_VERIFICATION_METHOD,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
      CRI_URL,
    );
    expect(isValidCredential).toEqual(true);
  });

  it("should return 400 and 'invalid_credential_request' when the credential offer cannot be found in the database", async () => {
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
      expect((error as AxiosError).response?.status).toEqual(400);
      expect((error as AxiosError).response?.data).toEqual({
        error: "invalid_credential_request",
      });
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
