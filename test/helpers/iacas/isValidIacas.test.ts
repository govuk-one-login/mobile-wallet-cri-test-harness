import { isValidIacas, Iacas } from "./isValidIacas";
import { X509Certificate } from "@peculiar/x509";

describe("isValidIacas", () => {
  it("should return 'true' when IACAs document is valid", async () => {
    const iacas = getIacas();

    const result = await isValidIacas(iacas);

    expect(result).toBe(true);
  });

  it("should throw an error when country is not GB", async () => {
    const iacas = getIacas();
    iacas.data[0].certificateData.country = "DE"; // Not the value expected by the schema ("GB")

    await expect(isValidIacas(iacas)).rejects.toThrow(
      'INVALID_IACAS: Schema validation failed. [{"instancePath":"/data/0/certificateData/country","schemaPath":"#/properties/data/items/properties/certificateData/properties/country/const","keyword":"const","params":{"allowedValue":"GB"},"message":"must be equal to constant"}]',
    );
  });

  it("should throw an error if the certificate is not valid PEM", async () => {
    const iacas = getIacas();
    iacas.data[0].certificatePem = "invalid-pem"; // Not a valid PEM

    await expect(isValidIacas(iacas)).rejects.toThrow(
      "INVALID_IACAS: Certificate PEM could not be parsed as X509",
    );
  });

  it("should throw an error if commonName does not match", async () => {
    const iacas = getIacas();
    iacas.data[0].certificateData.commonName = "Another Name"; // Different name

    await expect(isValidIacas(iacas)).rejects.toThrow(
      'INVALID_IACAS: commonName does not match. Should be "Another Name" but found "mDL Example IACA Root - LOCAL environment"',
    );
  });

  it("should throw an error if notBefore does not match", async () => {
    const iacas = getIacas();
    iacas.data[0].certificateData.notBefore = "2025-04-15T12:30:34.000Z"; // Different date

    await expect(isValidIacas(iacas)).rejects.toThrow(
      'INVALID_IACAS: notBefore does not match. Should be "2025-04-15T12:30:34.000Z" but found "2025-06-19T11:08:51.000Z"',
    );
  });

  it("should throw an error if notAfter does not match", async () => {
    const iacas = getIacas();
    iacas.data[0].certificateData.notAfter = "2034-04-16T13:30:34.000Z"; // Different date

    await expect(isValidIacas(iacas)).rejects.toThrow(
      'INVALID_IACAS: notAfter does not match. Should be "2034-04-16T13:30:34.000Z" but found "2035-06-17T11:08:51.000Z"',
    );
  });

  it("should throw an error if fingerprint does not match", async () => {
    const iacas = getIacas();
    iacas.data[0].certificateFingerprint =
      "e5b9c5a9668cb256d42182b21009a0a961cb0ff53138fa7156cf25a63122931c"; // Different fingerprint

    await expect(isValidIacas(iacas)).rejects.toThrow(
      'INVALID_IACAS: Fingerprint does not match. Should be "e5b9c5a9668cb256d42182b21009a0a961cb0ff53138fa7156cf25a63122931c" but found "62c8cec7894b4dad6ead9301644aacdec5cf864638d7d65790c5c1f152cd1507"',
    );
  });

  it("should throw an error if signature cannot be verified", async () => {
    const iacas = getIacas();
    iacas.data[0].publicKeyJwk = {
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      alg: "ES256",
    }; // Different public key JWK

    await expect(isValidIacas(iacas)).rejects.toThrow(
      "INVALID_IACAS: Signature verification failed with provided JWK",
    );
  });

  it("should throw an error if the certificate is not self-signed", async () => {
    const iacas = getIacas();
    jest
      .spyOn(X509Certificate.prototype, "isSelfSigned")
      .mockResolvedValue(false);

    await expect(isValidIacas(iacas)).rejects.toThrow(
      "INVALID_IACAS: Certificate is not self-signed",
    );
  });
});

function getIacas(): Iacas {
  return {
    data: [
      {
        id: "6bb42872-f4ed-4d55-a937-b8ffb8760de4",
        active: true,
        certificatePem:
          "-----BEGIN CERTIFICATE-----MIICzzCCAnWgAwIBAgIUFBD7/XkDw4D/UTy7/pf1Q7c43/kwCgYIKoZIzj0EAwIwgbwxCzAJBgNVBAYTAlVLMQ8wDQYDVQQIDAZMb25kb24xNDAyBgNVBAoMK21ETCBFeGFtcGxlIElBQ0EgUm9vdCAtIERFTE9DQUwgZW52aXJvbm1lbnQxMjAwBgNVBAsMKW1ETCBFeGFtcGxlIElBQ0EgUm9vdCAtIExPQ0FMIGVudmlyb25tZW50MTIwMAYDVQQDDCltREwgRXhhbXBsZSBJQUNBIFJvb3QgLSBMT0NBTCBlbnZpcm9ubWVudDAeFw0yNTA2MTkxMTA4NTFaFw0zNTA2MTcxMTA4NTFaMIG8MQswCQYDVQQGEwJVSzEPMA0GA1UECAwGTG9uZG9uMTQwMgYDVQQKDCttREwgRXhhbXBsZSBJQUNBIFJvb3QgLSBERUxPQ0FMIGVudmlyb25tZW50MTIwMAYDVQQLDCltREwgRXhhbXBsZSBJQUNBIFJvb3QgLSBMT0NBTCBlbnZpcm9ubWVudDEyMDAGA1UEAwwpbURMIEV4YW1wbGUgSUFDQSBSb290IC0gTE9DQUwgZW52aXJvbm1lbnQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATK8ZrETZ7FQXw3+xj7fLV2yv1vFLOlZE0r2MQ0ysBOa/uZ7dUlOCvROTt5fpDR9e+Hdq0h9trZwwBY2HODAWVbo1MwUTAdBgNVHQ4EFgQUnelQVCApK3NIxVeQ3X+zUsogQxgwHwYDVR0jBBgwFoAUnelQVCApK3NIxVeQ3X+zUsogQxgwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNIADBFAiBwnpi6jeCSLxZgFeFLSN+zaG3zj9t6QcGFklY521tMtQIhAOF65mV0uski5+50FtKkJcVnS/1EDGrgor5bFeZDvdAI-----END CERTIFICATE-----",
        certificateData: {
          notAfter: "2035-06-17T11:08:51.000Z",
          notBefore: "2025-06-19T11:08:51.000Z",
          country: "GB",
          commonName: "mDL Example IACA Root - LOCAL environment",
        },
        certificateFingerprint:
          "62c8cec7894b4dad6ead9301644aacdec5cf864638d7d65790c5c1f152cd1507",
        publicKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "yvGaxE2exUF8N_sY-3y1dsr9bxSzpWRNK9jENMrATms",
          y: "-5nt1SU4K9E5O3l-kNH174d2rSH22tnDAFjYc4MBZVs",
          alg: "ES256",
        },
      },
    ],
  };
}
