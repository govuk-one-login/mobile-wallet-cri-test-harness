import { getCredentialOfferDeepLink } from "../src/config";
import {
  CredentialOffer,
  getCredentialOffer,
  parseAsJson,
  validateCredentialOffer,
} from "./helpers/credentialOffer/validateCredentialOffer";

describe("tests", () => {
  const credentialOfferDeepLink = getCredentialOfferDeepLink();

  it("should validate the credential offer", async () => {
    const outcome = validateCredentialOffer(credentialOfferDeepLink);
    expect(outcome).toEqual(true);
  });

  it("should be future test that needs the pre-authorized code", async () => {
    const credentialOffer = getCredentialOffer(credentialOfferDeepLink);
    const preAuthorizedCode = (parseAsJson(credentialOffer!) as CredentialOffer)
      .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
      "pre-authorized_code"
    ];
    expect(preAuthorizedCode).toBeTruthy();
  });
});
