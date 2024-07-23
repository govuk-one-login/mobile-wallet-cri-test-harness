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
import { JWK } from "jose";
import {
  invalidAccessTokenSignature,
  invalidNonce,
  invalidProofSignature,
  invalidWalletSubjectId,
} from "./helpers/credential/validateCredentialErrorScenarios";

let CREDENTIAL_OFFER_DEEP_LINK;
let CRI_URL;
let CRI_DOMAIN;
let WALLET_SUBJECT_ID;
let PRE_AUTHORIZED_CODE;
let DID_JWKS;
let CREDENTIALS_ENDPOINT;
let PRIVATE_KEY_JWK;
let PUBLIC_KEY_JWK;

describe("credential-issuer-tests", () => {
  beforeAll(async () => {
    CREDENTIAL_OFFER_DEEP_LINK = getCredentialOfferDeepLink();
    CRI_URL = getCriUrl();
    CRI_DOMAIN = getCriDomain();
    WALLET_SUBJECT_ID = getWalletSubjectId();
    PRE_AUTHORIZED_CODE = extractPreAuthorizedCode(CREDENTIAL_OFFER_DEEP_LINK);
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
  });

  it("should validate the credential offer", async () => {
    const response = validateCredentialOffer(CREDENTIAL_OFFER_DEEP_LINK);
    expect(response).toEqual(true);
  });

  it("should validate the credential metadata", async () => {
    const response = await validateMetadata(CRI_URL);
    expect(response).toEqual(true);
  });

  it("should validate the DID document", async () => {
    const response = await validateDidDocument(CRI_URL, CRI_DOMAIN);
    expect(response).toEqual(true);
  });

  it("should validate the pre-authorized code", async () => {
    const response = await validatePreAuthorizedCode(
      PRE_AUTHORIZED_CODE,
      DID_JWKS,
    );
    expect(response).toEqual(true);
  });

  it("should validate the credential", async () => {
    const response = await validateCredential(
      PRE_AUTHORIZED_CODE,
      WALLET_SUBJECT_ID,
      CREDENTIALS_ENDPOINT,
      DID_JWKS,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
    );
    expect(response).toEqual(true);
  });

  it("should return true when CRI returns 400 'invalid_credential_request' when the walletSubjectId does not match", async () => {
    const walletSubjectId = "not_the_same_wallet_subject_id";

    const response = await invalidWalletSubjectId(
      PRE_AUTHORIZED_CODE,
      walletSubjectId,
      CREDENTIALS_ENDPOINT,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
    );
    expect(response).toEqual(true);
  });

  it("should return true when CRI returns 400 'invalid_credential_request' when the access token signature is invalid", async () => {
    const response = await invalidAccessTokenSignature(
      PRE_AUTHORIZED_CODE,
      WALLET_SUBJECT_ID,
      CREDENTIALS_ENDPOINT,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
    );
    expect(response).toEqual(true);
  });

  it("should return true when CRI returns 400 'invalid_proof' when the proof JWT nonce does not match access token c_nonce", async () => {
    const response = await invalidNonce(
      PRE_AUTHORIZED_CODE,
      WALLET_SUBJECT_ID,
      CREDENTIALS_ENDPOINT,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
    );
    expect(response).toEqual(true);
  });

  it("should return true when CRI returns 400 'invalid_proof' when the proof JWT signature is invalid", async () => {
    const response = await invalidProofSignature(
      PRE_AUTHORIZED_CODE,
      WALLET_SUBJECT_ID,
      CREDENTIALS_ENDPOINT,
      PRIVATE_KEY_JWK,
      PUBLIC_KEY_JWK,
    );
    expect(response).toEqual(true);
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
