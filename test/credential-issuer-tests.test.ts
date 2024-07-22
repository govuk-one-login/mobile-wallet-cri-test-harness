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
import { readFileSync } from "fs";
import { JWK } from "jose";
import { createCredentialRequest } from "./helpers/credential/createCredentialRequest";

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
    const publicKeyJwks = didDocument.verificationMethod.map(
      (verificationMethod) => verificationMethod.publicKeyJwk,
    );

    expect(
      await validatePreAuthorizedCode(preAuthorizedCode, publicKeyJwks),
    ).toEqual(true);
  });

  it("should generate the credential request", async () => {
    const preAuthorizedCode = extractPreAuthorizedCode(credentialOfferDeepLink);
    const privateKey = JSON.parse(
      readFileSync("test/helpers/credential/privateKey", "utf8"),
    ) as JWK;
    const publicKey = JSON.parse(
      readFileSync("test/helpers/credential/publicKey", "utf8"),
    ) as JWK;

    const { accessToken, proofJwt } = await createCredentialRequest(
      preAuthorizedCode,
      walletSubjectId,
      privateKey,
      publicKey,
    );
    console.log("Access token:", accessToken);
    console.log("Proof JWT:", proofJwt);

    expect(accessToken).toBeTruthy();
    expect(proofJwt).toBeTruthy();
  });

  it("should be future test that needs the metadata", async () => {
    const metadata: Metadata = (await getMetadata(criUrl)).data;
    expect(metadata).toBeTruthy();
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
