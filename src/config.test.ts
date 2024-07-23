import { getCriUrl, getPortNumber } from "./config";

describe("config", () => {
  it("should prepend 'http://' when domain starts with 'host.docker.internal'", async () => {
    process.env.CRI_DOMAIN = "host.docker.internal:3000";
    const response = getCriUrl();
    expect(response).toEqual("http://host.docker.internal:3000");
  });

  it("should prepend 'http://' when domain starts with 'localhost'", async () => {
    process.env.CRI_DOMAIN = "localhost:3000";
    const response = getCriUrl();
    expect(response).toEqual("http://localhost:3000");
  });

  it("should prepend 'https://' when domain does not start with 'host.docker.internal' or 'localhost'", async () => {
    process.env.CRI_DOMAIN = "example.cri.test.gov.uk";
    const response = getCriUrl();
    expect(response).toEqual("https://example.cri.test.gov.uk");
  });

  it("should throw error if environment variable is not defined", async () => {
    process.env.PORT = "";
    expect(() => getPortNumber()).toThrow("PORT environment variable not set");
  });
});
