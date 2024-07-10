import { getCredentialOffer, getCriDomain } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOffer/credentialOfferService";
import { MetadataService } from "./helpers/metadata/metadataService";

describe("tests", () => {
  const credentialOfferDeepLink = getCredentialOffer();
  const criDomain = getCriDomain();

  it("should validate the credential offer", async () => {
    const credentialOfferService = CredentialOfferService.instance;
    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
  });

  it("should validate the credential metadata", async () => {
    const metadataService = MetadataService.instance;
    expect(await metadataService.validate(criDomain)).toEqual(true);
  });

  it("should be another test in the future", async () => {
    const preAuthorizedCode = CredentialOfferService.instance.preAuthorizedCode;
    console.log(preAuthorizedCode);
    const authorizationServersEndpoint =
      MetadataService.instance.authorizationServersEndpoint;
    console.log(authorizationServersEndpoint);
    const credentialEndpoint = MetadataService.instance.credentialsEndpoint;
    console.log(credentialEndpoint);
  });
});
