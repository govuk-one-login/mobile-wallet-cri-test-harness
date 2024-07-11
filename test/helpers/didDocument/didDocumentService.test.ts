import { DidDocumentService } from "./didDocumentService";
import axios, { AxiosResponse } from "axios";

jest.mock("axios");
console.log = jest.fn();

describe("didDocumentService", () => {
  let didDocumentService: DidDocumentService;
  beforeEach(() => {
    didDocumentService = DidDocumentService.instance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it("should return 'true' when DID document is valid", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
          {
            id: "did:web:example-cri.test.gov.uk#6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
          "did:web:example-cri.test.gov.uk#6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    expect(
      await didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).toEqual(true);
    expect(didDocumentService.publicKeys).toEqual([
      {
        crv: "P-256",
        kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        kty: "EC",
        x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
        y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
      },
      {
        crv: "P-256",
        kid: "6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
        kty: "EC",
        x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
        y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
      },
    ]);
  });

  it("should throw 'GET_DID_DOCUMENT_ERROR' error when an error is thrown when trying to fetch the DID document", async () => {
    const mockedResponse = {
      status: 500,
    } as AxiosResponse;
    mockedAxios.get.mockRejectedValue(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("GET_DID_DOCUMENT_ERROR");
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    const mockedResponse = {
      status: 201,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_RESPONSE_DATA");
  });

  it("should throw 'INVALID_DID_DOCUMENT' error when 'verificationMethod' missing from DID document", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_DID_DOCUMENT");
  });

  it("should throw 'INVALID_DID_DOCUMENT' error when 'id' does not match pattern", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:SOMETHING-ELSE.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_DID_DOCUMENT");
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      'Invalid "id" value in DID document. Should be did:web:example-cri.test.gov.uk but found did:web:SOMETHING-ELSE.test.gov.uk',
    );
  });

  it("should throw 'INVALID_DID_DOCUMENT' error when 'controller' does not match pattern", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:SOMETHING-ELSE.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_DID_DOCUMENT");
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      'Invalid "controller" value in "verificationMethod". Should be did:web:example-cri.test.gov.uk but found did:web:SOMETHING-ELSE.test.gov.uk',
    );
  });

  it("should throw 'INVALID_DID_DOCUMENT' error when 'assertionMethod' is missing an 'id'", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
          {
            id: "did:web:example-cri.test.gov.uk#6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_DID_DOCUMENT");
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      '"id" did:web:example-cri.test.gov.uk#6dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510a is missing in "assertionMethod" did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f',
    );
  });

  it("should throw 'INVALID_DID_DOCUMENT' error when 'kid' is not in 'id'", async () => {
    const mockedResponse = {
      status: 200,
      data: {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://www.w3.org/ns/security/jwk/v1",
        ],
        id: "did:web:example-cri.test.gov.uk",
        verificationMethod: [
          {
            id: "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
            type: "JsonWebKey2020",
            controller: "did:web:example-cri.test.gov.uk",
            publicKeyJwk: {
              kty: "EC",
              kid: "SOMETHING-ELSE",
              crv: "P-256",
              x: "6jCKX_QRrmTeEJi-uiwcYqu8BgMgl70g2pdAst24MPE",
              y: "icPzjbSk6apD_SNvQt8NWOPlPeGG4KYU55GfnARryoY",
            },
          },
        ],
        assertionMethod: [
          "did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f",
        ],
      },
    } as AxiosResponse;
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    await expect(
      didDocumentService.validate(
        "https://example-cri.test.gov.uk",
        "example-cri.test.gov.uk",
      ),
    ).rejects.toThrow("INVALID_DID_DOCUMENT");
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      'Invalid "id" value in "verificationMethod". Should be did:web:example-cri.test.gov.uk#SOMETHING-ELSE but found did:web:example-cri.test.gov.uk#5dcbee863b5d7cc30c9ba1f7393dacc6c16610782e4b6a191f94a7e8b1e1510f',
    );
  });
});
