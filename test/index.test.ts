import { getCredentialOffer, getCriDomain } from "../src/config";
import { CredentialOfferService } from "./helpers/credentialOfferService";
import { MetadataService } from "./helpers/metadataService";

let PREAUTHORIZED_CODE: string;
let CREDENTIALS_ENDPOINT: string;
let AUTHORIZATION_SERVER: string;

describe("tests", () => {
  console.log("Running tests");
  const credentialOfferDeepLink = getCredentialOffer();
  const criDomain = getCriDomain();

  it("should validate the credential offer", () => {
    const credentialOfferService = CredentialOfferService.instance;
    expect(credentialOfferService.validate(credentialOfferDeepLink)).toEqual(
      true,
    );
    PREAUTHORIZED_CODE = credentialOfferService.preAuthorizedCode;
    console.log(PREAUTHORIZED_CODE);
  });

  it("should validate the credential metadata", async () => {
    const metadataService = MetadataService.instance;
    expect(await metadataService.validate(criDomain)).toEqual(true);

    CREDENTIALS_ENDPOINT = metadataService.getCredentialsEndpoint;
    console.log(CREDENTIALS_ENDPOINT);
    AUTHORIZATION_SERVER = metadataService.getAuthorizationServersEndpoint;
    console.log(AUTHORIZATION_SERVER);
  });
});
