import {
  getCriUrl,
  getDockerDnsName,
  getPortNumber,
  getSelfURL,
} from "./config";

describe("config", () => {
  it("should throw error if environment variable is not defined", async () => {
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

  it("should replace 'localhost' with 'host.docker.internal'", async () => {
    expect(getDockerDnsName("http://localhost:3000")).toEqual(
      "http://host.docker.internal:3000",
    );
  });

  it("should not change URL if it does not start with 'localhost'", async () => {
    expect(getDockerDnsName("https://example.cri.test.gov.uk")).toEqual(
      "https://example.cri.test.gov.uk",
    );
  });
});
