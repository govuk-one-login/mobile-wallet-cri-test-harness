import { validateMetadata } from "./validateMetadata";
import axios, { AxiosError, AxiosResponse } from "axios";

jest.mock("axios");
console.log = jest.fn();

describe("validateMetadata", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const TEST_CRI_URL = "https://example-cri.test.gov.uk";
  const TEST_AUTH_SERVER_URL = "https://auth-server.test.gov.uk";

  it("should return 'true' when metadata is valid", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: TEST_CRI_URL + "/credential",
        authorization_servers: [TEST_AUTH_SERVER_URL],
        credential_issuer: TEST_CRI_URL,
        credential_configurations_supported: {
          dummyCredential: {
            format: "jwt_vc_json",
            id: "DummyCredential_JWT",
            types: ["VerifiableCredential", "DummyCredential"],
          },
        },
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    expect(await validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL)).toEqual(
      true,
    );
  });

  it("should throw 'GET_METADATA_ERROR' error when an error is thrown when trying to fetch the metadata", async () => {
    const axiosError = new AxiosError();
    axiosError.response = {
      status: 500,
      data: "some_error",
    } as AxiosResponse;
    mockedAxios.get.mockRejectedValueOnce(axiosError);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("GET_METADATA_ERROR");
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const mockedResponse = {
      status: 202,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("INVALID_RESPONSE_DATA");
  });

  it("should throw 'INVALID_METADATA' error when 'credential_configurations_supported' is missing", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: TEST_CRI_URL + "/credential",
        authorization_servers: [TEST_AUTH_SERVER_URL],
        credential_issuer: TEST_CRI_URL,
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("INVALID_METADATA");
  });

  it("should throw 'INVALID_METADATA' error when 'credentials_endpoint' does not match CRI URL", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: TEST_CRI_URL + "/credential",
        authorization_servers: [TEST_AUTH_SERVER_URL],
        credential_issuer: "https://something-else.com/",
        credential_configurations_supported: {
          dummyCredential: {
            format: "jwt_vc_json",
            id: "DummyCredential_JWT",
            types: ["VerifiableCredential", "DummyCredential"],
          },
        },
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "credential_issuer" value. Should be https://example-cri.test.gov.uk but found https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' does not match the test harness URL", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: TEST_CRI_URL + "/credential",
        authorization_servers: ["https://something-else.com/"],
        credential_issuer: TEST_CRI_URL,
        credential_configurations_supported: {
          dummyCredential: {
            format: "jwt_vc_json",
            id: "DummyCredential_JWT",
            types: ["VerifiableCredential", "DummyCredential"],
          },
        },
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata(TEST_CRI_URL, TEST_AUTH_SERVER_URL),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "authorization_servers" value. Should contain https://auth-server.test.gov.uk but only contains https://something-else.com/',
    );
  });
});
