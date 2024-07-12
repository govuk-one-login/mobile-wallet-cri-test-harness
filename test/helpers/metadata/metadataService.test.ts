import { MetadataService } from "./metadataService";
import axios, { AxiosResponse } from "axios";

jest.mock("axios");
console.log = jest.fn();

describe("credentialOfferService", () => {
  let metadataService: MetadataService;
  beforeEach(() => {
    metadataService = new MetadataService();
  });

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
    expect(
      await metadataService.validate("https://example-cri.test.gov.uk"),
    ).toEqual(true);
    expect(metadataService.authorizationServersEndpoint).toEqual(
      "http://localhost:8888/sts-stub",
    );
    expect(metadataService.credentialsEndpoint).toEqual(
      "http://localhost:8080/credential",
    );
  });

  it("should throw 'GET_METADATA_ERROR' error when an error is thrown when trying to fetch the metadata", async () => {
    const mockedResponse = {
      status: 500,
    } as AxiosResponse;
    mockedAxios.get.mockRejectedValue(mockedResponse);
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("GET_METADATA_ERROR");
    expect(metadataService.authorizationServersEndpoint).toEqual(undefined);
    expect(metadataService.credentialsEndpoint).toEqual(undefined);
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const mockedResponse = {
      status: 202,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_STATUS_CODE");
    expect(metadataService.authorizationServersEndpoint).toEqual(undefined);
    expect(metadataService.credentialsEndpoint).toEqual(undefined);
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_RESPONSE_DATA");
    expect(metadataService.authorizationServersEndpoint).toEqual(undefined);
    expect(metadataService.credentialsEndpoint).toEqual(undefined);
  });

  it("should throw 'INVALID_METADATA' error when 'credential_configurations_supported' is missing and should still set the credentials and authorization servers endpoints properties", async () => {
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
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Metadata does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"credential_configurations_supported"},"message":"must have required property \'credential_configurations_supported\'"}]',
    );
    expect(metadataService.authorizationServersEndpoint).toEqual(
      "http://localhost:8888/sts-stub",
    );
    expect(metadataService.credentialsEndpoint).toEqual(
      "http://localhost:8080/credential",
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credentials_endpoint' is invalid and should not set the credentials endpoint property", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: "notAValidUri",
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
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Metadata does not comply with the schema: [{"instancePath":"/credentials_endpoint","schemaPath":"#/properties/credentials_endpoint/format","keyword":"format","params":{"format":"uri"},"message":"must match format \\"uri\\""}]',
    );
    expect(metadataService.authorizationServersEndpoint).toEqual(
      "http://localhost:8888/sts-stub",
    );
    expect(metadataService.credentialsEndpoint).toEqual(undefined);
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' is missing and should not set the authorization servers endpoint property", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: "http://localhost:8080/credential",
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
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Metadata does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"authorization_servers"},"message":"must have required property \'authorization_servers\'"}]',
    );
    expect(metadataService.authorizationServersEndpoint).toEqual(undefined);
    expect(metadataService.credentialsEndpoint).toEqual(
      "http://localhost:8080/credential",
    );
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' and 'credentials_endpoint' are invalid and should not set the authorization servers and credentials endpoints properties", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        credentials_endpoint: "",
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
    await expect(
      metadataService.validate("https://example-cri.test.gov.uk"),
    ).rejects.toThrow("INVALID_METADATA");
    expect(console.log).toHaveBeenCalledWith(
      'Metadata does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"authorization_servers"},"message":"must have required property \'authorization_servers\'"},{"instancePath":"/credentials_endpoint","schemaPath":"#/properties/credentials_endpoint/format","keyword":"format","params":{"format":"uri"},"message":"must match format \\"uri\\""}]',
    );
    expect(metadataService.authorizationServersEndpoint).toEqual(undefined);
    expect(metadataService.credentialsEndpoint).toEqual(undefined);
  });
});
