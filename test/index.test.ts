import { getCredentialOffer } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOffer/credentialOfferService";

describe("tests", () => {
  it("should validate the credential offer", async () => {
    const credentialOfferService = CredentialOfferService.instance;
    const credentialOfferDeepLink = getCredentialOffer();

    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
  });

  it("should be another test in the future", async () => {
    const preAuthorizedCode = CredentialOfferService.instance.preAuthorizedCode;
    console.log(preAuthorizedCode);
  });
});
