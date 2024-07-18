import {
  getCriDomain,
  getCriUrl,
  getCredentialOfferDeepLink,
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

describe("credential-issuer-tests", () => {
  const credentialOfferDeepLink = getCredentialOfferDeepLink();
  const criUrl = getCriUrl();
  const criDomain = getCriDomain();

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
    const credentialOffer = getCredentialOffer(credentialOfferDeepLink);
    const preAuthorizedCode = (parseAsJson(credentialOffer!) as CredentialOffer)
      .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
      "pre-authorized_code"
    ];

    const didDocument: DidDocument = (await getDidDocument(criUrl)).data;
    const publicKeyJwks = didDocument.verificationMethod.map(
      (verificationMethod) => verificationMethod.publicKeyJwk,
    );

    expect(
      await validatePreAuthorizedCode(preAuthorizedCode, publicKeyJwks),
    ).toEqual(true);
  });

  it("should be future test that needs the metadata", async () => {
    const metadata: Metadata = (await getMetadata(criUrl)).data;
    expect(metadata).toBeTruthy();
  });
});
