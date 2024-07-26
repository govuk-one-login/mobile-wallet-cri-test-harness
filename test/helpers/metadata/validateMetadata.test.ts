import { validateMetadata } from "./validateMetadata";
import axios, { AxiosError, AxiosResponse } from "axios";

jest.mock("axios");

describe("validateMetadata", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it("should return 'true' when metadata is valid", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: "http://localhost:8080/credential",
        authorization_servers: ["http://localhost:8888/sts-stub"],
        credential_issuer: "http://localhost:8080",
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
    expect(await validateMetadata("https://example-cri.test.gov.uk")).toEqual(
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
      validateMetadata("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("GET_METADATA_ERROR");
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const mockedResponse = {
      status: 202,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_RESPONSE_DATA");
  });

  it("should throw 'INVALID_METADATA' error when 'credential_configurations_supported' is missing", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: "http://localhost:8080/credential",
        authorization_servers: ["http://localhost:8888/sts-stub"],
        credential_issuer: "http://localhost:8080",
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      validateMetadata("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_METADATA");
  });
});
