import { getCredentialOffer } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOfferService";

let PREAUTHORIZED_CODE: string;

describe("tests", () => {
  console.log("Running tests");

  it("should validate the credential offer", async () => {
    const credentialOfferService = CredentialOfferService.instance;
    const credentialOfferDeepLink = getCredentialOffer();

    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
    PREAUTHORIZED_CODE = credentialOfferService.preAuthorizedCode;
    console.log(PREAUTHORIZED_CODE);
  });
});
