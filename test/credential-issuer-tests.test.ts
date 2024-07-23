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

describe("credential-issuer-tests", () => {
  const credentialOfferDeepLink = getCredentialOfferDeepLink();
  const criUrl = getCriUrl();
  const criDomain = getCriDomain();
  const walletSubjectId = getWalletSubjectId();

  it("should validate the credential offer", async () => {
    const outcome = validateCredentialOffer(credentialOfferDeepLink);
    expect(outcome).toEqual(true);
  });

  it("should validate the credential metadata", async () => {
    expect(await validateMetadata(criUrl)).toEqual(true);
  });

  it("should validate the DID document", async () => {
    expect(await validateDidDocument(criUrl, criDomain)).toEqual(true);
  });

  it("should validate the pre-authorized code", async () => {
    const preAuthorizedCode = extractPreAuthorizedCode(credentialOfferDeepLink);
    const didDocument: DidDocument = (await getDidDocument(criUrl)).data;
    const publicKeyJwks = extractJwks(didDocument);

    expect(
      await validatePreAuthorizedCode(preAuthorizedCode, publicKeyJwks),
    ).toEqual(true);
  });

  it("should validate the credential", async () => {
    const preAuthorizedCode = extractPreAuthorizedCode(credentialOfferDeepLink);
    const didDocument: DidDocument = (await getDidDocument(criUrl)).data;
    const didJwks = extractJwks(didDocument);
    const metadata: Metadata = (await getMetadata(criUrl)).data;
    const privateKey = JSON.parse(
      readFileSync("test/helpers/credential/privateKey", "utf8"),
    ) as JWK;
    const publicKey = JSON.parse(
      readFileSync("test/helpers/credential/publicKey", "utf8"),
    ) as JWK;

    const response = await validateCredential(
      preAuthorizedCode,
      walletSubjectId,
      metadata.credentials_endpoint,
      didJwks,
      privateKey,
      publicKey,
    );
    expect(response).toBeTruthy();
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
