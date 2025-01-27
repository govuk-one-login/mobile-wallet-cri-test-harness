import { validateMetadata } from "./validateMetadata";
import axios, { AxiosError, AxiosResponse } from "axios";

jest.mock("axios");
console.log = jest.fn();

const authServerUrl = "https://test-auth-server.gov.uk";
const criUrl = "https://test-example-cri.gov.uk";

describe("validateMetadata", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 'true' when metadata is valid", async () => {
    const mockedResponse = {
      status: 200,
      data: getTestMetadata(criUrl, authServerUrl),
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    expect(await validateMetadata(criUrl, authServerUrl)).toEqual(true);
  });

  it("should throw 'GET_METADATA_ERROR' error when an error is thrown when trying to fetch the metadata", async () => {
    const axiosError = new AxiosError();
    axiosError.response = {
      status: 500,
      data: "some_error",
    } as AxiosResponse;
    mockedAxios.get.mockRejectedValueOnce(axiosError);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "GET_METADATA_ERROR",
    );
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const mockedResponse = {
      status: 202,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "INVALID_STATUS_CODE",
    );
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "INVALID_RESPONSE_DATA",
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_configurations_supported' is missing", async () => {
    const mockedResponse = {
      status: 200,
      data: getTestMetadata(criUrl, authServerUrl, false),
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "INVALID_METADATA",
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_issuer' does not match CRI URL", async () => {
    const mockedResponse = {
      status: 200,
      data: getTestMetadata("https://something-else.com/", authServerUrl),
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "INVALID_METADATA",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "credential_issuer" value. Should be https://test-example-cri.gov.uk but found https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' does not match the test harness URL", async () => {
    const mockedResponse = {
      status: 200,
      data: getTestMetadata(criUrl, "https://something-else.com/"),
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(validateMetadata(criUrl, authServerUrl)).rejects.toThrow(
      "INVALID_METADATA",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "authorization_servers" value. Should contain https://test-auth-server.gov.uk but only contains https://something-else.com/',
    );
  });
});

function getTestMetadata(criUrl, authServerUrl, credentialConfig = true) {
  return {
    credential_endpoint: criUrl + "/credential",
    authorization_servers: [authServerUrl],
    credential_issuer: criUrl,
    ...(credentialConfig && {
      credential_configurations_supported: {
        dummyCredential: {
          format: "jwt_vc_json",
          id: "DummyCredential_JWT",
          types: ["VerifiableCredential", "DummyCredential"],
        },
      },
    }),
  };
}
