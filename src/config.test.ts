import {
  getClientId,
  getCredentialOfferDeepLink,
  getCriUrl,
  getPortNumber,
  getSelfURL,
  getWalletSubjectId,
} from "./config";

console.log = jest.fn();

describe("config", () => {
  it("should throw error when PORT is not set", async () => {
    process.env.PORT = "";
    expect(() => getPortNumber()).toThrow("PORT environment variable not set");
  });

  it("should prepend 'http://' when domain starts with 'localhost'", async () => {
    process.env.CRI_DOMAIN = "localhost:3000";
    const response = getCriUrl();
    expect(response).toEqual("http://localhost:3000");
  });

  it("should prepend 'https://' when domain does not start with 'localhost'", async () => {
    process.env.CRI_DOMAIN = "example.cri.test.gov.uk";
    const response = getCriUrl();
    expect(response).toEqual("https://example.cri.test.gov.uk");
  });

  it("should return localhost address when TEST_HARNESS_URL is not set", async () => {
    process.env.PORT = "3000";
    process.env.TEST_HARNESS_URL = "";
    expect(getSelfURL()).toEqual("http://localhost:3000");
  });

  it("should return TEST_HARNESS_URL value when set", async () => {
    process.env.TEST_HARNESS_URL = "https://test-harness.test.gov.uk";
    expect(getSelfURL()).toEqual("https://test-harness.test.gov.uk");
  });

  it("should throw error when CREDENTIAL_OFFER_DEEP_LINK is not set", async () => {
    expect(() => {
      getCredentialOfferDeepLink();
    }).toThrow("CREDENTIAL_OFFER_DEEP_LINK environment variable not set");
  });

  it("should throw error when WALLET_SUBJECT_ID is not set", async () => {
    expect(() => {
      getWalletSubjectId();
    }).toThrow("WALLET_SUBJECT_ID environment variable not set");
  });

  it("should throw error when CLIENT_ID is not set", async () => {
    expect(() => {
      getClientId();
    }).toThrow("CLIENT_ID environment variable not set");
  });
});
