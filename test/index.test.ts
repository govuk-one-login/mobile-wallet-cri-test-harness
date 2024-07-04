import { getCredentialOffer } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOfferService";

let PREAUTHORIZED_CODE: string;

describe("tests", () => {
  console.log("Running tests");

  it("should validate the credential offer", async () => {
    const credentialOfferService = CredentialOfferService.instance;
    const credentialOfferDeepLink = getCredentialOffer();

    // const credentialOfferDeepLink =
    //   "https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D";
    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
    PREAUTHORIZED_CODE = credentialOfferService.preAuthorizedCode;
    console.log(PREAUTHORIZED_CODE);
  });
});
