import { getCredentialOffer, getCriDomain, getCriUrl } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOffer/credentialOfferService";
import { MetadataService } from "./helpers/metadata/metadataService";
import { DidDocumentService } from "./helpers/didDocument/didDocumentService";

describe("tests", () => {
  const credentialOfferDeepLink = getCredentialOffer();
  const criUrl = getCriUrl();
  const criDomain = getCriDomain();

  it("should validate the credential offer", async () => {
    const credentialOfferService = CredentialOfferService.instance;
    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
  });

  it("should validate the credential metadata", async () => {
    const metadataService = MetadataService.instance;
    expect(await metadataService.validate(criUrl)).toEqual(true);
  });

  it("should validate the DID document", async () => {
    const didDocumentService = DidDocumentService.instance;
    expect(await didDocumentService.validate(criUrl, criDomain)).toEqual(true);
  });

  it("should be another test in the future", async () => {
    const preAuthorizedCode = CredentialOfferService.instance.preAuthorizedCode;
    console.log(preAuthorizedCode);
    const authorizationServersEndpoint =
      MetadataService.instance.authorizationServersEndpoint;
    console.log(authorizationServersEndpoint);
    const credentialEndpoint = MetadataService.instance.credentialsEndpoint;
    console.log(credentialEndpoint);
    const publicKeyJwk = DidDocumentService.instance.publicKeys;
    console.log(publicKeyJwk);
  });
});
