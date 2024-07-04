// import {readFileSync} from "fs";
import { getCredentialOffer } from "../src/config";

let PRE_AUTHORIZED_CODE: string;

function callThat() {
  // const data =  readFileSync("results/privateKey", 'utf8')
  return false;
}

function callThis() {
  return true;
}

function validateCredentialOffer(credentialOfferDeepLink: string) {
  let parsedUrl;
  try {
    parsedUrl = new URL(credentialOfferDeepLink);
  } catch (error) {
    console.log(error);
    return "INVALID_DEEP_LINK";
  }

  let credentialOfferParsed;
  try {
    const credentialOfferRaw = parsedUrl.searchParams.get("credential_offer");
    if (credentialOfferRaw == null) {
      return "INVALID_CREDENTIAL_OFFER";
    }
    credentialOfferParsed = JSON.parse(credentialOfferRaw);
  } catch (error) {
    console.log(error);
    return "INVALID_CREDENTIAL_OFFER";
  }

  const credentialIssuer = credentialOfferParsed["credential_issuer"];
  if (!credentialIssuer) {
    return "MISSING_CREDENTIAL_ISSUER";
  }
  try {
    new URL(credentialIssuer);
  } catch (error) {
    console.log(error);
    return "INVALID_CREDENTIAL_ISSUER";
  }

  const credentials = credentialOfferParsed["credentials"];
  if (!credentials) {
    return "MISSING_CREDENTIALS";
  }
  if (
    !Array.isArray(credentials) ||
    credentials.length < 1 ||
    !credentials[0]
  ) {
    return "INVALID_CREDENTIALS";
  }

  const grants = credentialOfferParsed["grants"];
  if (!grants) {
    return "MISSING_GRANTS";
  }

  const grantType =
    grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
  if (!grants) {
    return "MISSING_GRANT_TYPE";
  }

  const preAuthorizedCode = grantType["pre-authorized_code"];
  if (!preAuthorizedCode) {
    return "MISSING_PRE-AUTHORIZED_CODE";
  }

  PRE_AUTHORIZED_CODE = preAuthorizedCode;
  console.log(PRE_AUTHORIZED_CODE);
  return true;
}

describe("tests", () => {
  console.log("Running tests");

  it("should callThis and return true", async () => {
    expect(callThis()).toBe(true);
  });

  it("should callThat and return false", async () => {
    expect(callThat()).toBe(false);
  });

  it("should validate the credential offer", async () => {
    const credentialOfferDeepLink = getCredentialOffer();
    // const credentialOfferDeepLink =
    //   "https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D";
    expect(validateCredentialOffer(credentialOfferDeepLink)).toEqual(true);
  });
});
