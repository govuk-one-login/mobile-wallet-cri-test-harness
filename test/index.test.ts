import { getCredentialOffer } from "../src/config";
import {
  CredentialOffer,
  validateCredentialOffer,
} from "./helpers/credentialOffer/validateCredentialOffer";

describe("tests", () => {
  const credentialOfferDeepLink = getCredentialOffer();
  it("should validate the credential offer", async () => {
    const outcome = validateCredentialOffer(credentialOfferDeepLink);
    expect(outcome).toEqual(true);
  });

  it("should be future test that needs the pre-authorized code", async () => {
    const credentialOffer = new URL(credentialOfferDeepLink).searchParams.get(
      "credential_offer",
    );
    const preAuthorizedCode = (JSON.parse(credentialOffer!) as CredentialOffer)
      .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
      "pre-authorized_code"
    ];
    expect(preAuthorizedCode).toBeTruthy();
  });
});
