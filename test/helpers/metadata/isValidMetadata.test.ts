import { isValidMetadata } from "./isValidMetadata";

const authServerUrl = "https://test-auth-server.gov.uk";
const criUrl = "https://test-example-cri.gov.uk";

describe("isValidMetadata", () => {
  it("should return true when metadata is valid - JWT credential", async () => {
    const metadata = metadataBuilder().withDefaults();
    expect(
      await isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).toEqual(true);
  });

  it("should return true when metadata is valid - mDoc credential", async () => {
    const metadata = metadataBuilder().withOverrides({
      mdoc_iacas_uri: "https://test-example-cri.gov.uk/iacas",
    });
    expect(
      await isValidMetadata(metadata, criUrl, authServerUrl, "mdoc"),
    ).toEqual(true);
  });

  it("should return true when metadata is valid - notification_endpoint is present", async () => {
    const metadata = metadataBuilder().withOverrides({
      notification_endpoint: "https://test-example-cri.gov.uk/notification",
    });
    expect(
      await isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).toEqual(true);
  });

  it("should throw 'INVALID_METADATA' error when 'credential_configurations_supported' is missing", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_configurations_supported: false,
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).rejects.toThrow(
      'INVALID_METADATA: Metadata does not comply with the schema. [{"instancePath":"/credential_configurations_supported","schemaPath":"#/properties/credential_configurations_supported/type","keyword":"type","params":{"type":"object"},"message":"must be object"}]',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_issuer' does not match CRI URL", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_issuer: "https://something-else.com/",
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "credential_issuer" value. Should be https://test-example-cri.gov.uk but found https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_endpoint' does not match CRI's credential endpoint", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_endpoint: "https://something-else.com/something",
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "credential_endpoint" value. Should be https://test-example-cri.gov.uk/credential but found https://something-else.com/something',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'notification_endpoint' does not match CRI's notification endpoint", async () => {
    const metadata = metadataBuilder().withOverrides({
      notification_endpoint: "https://something-else.com/something",
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "notification_endpoint" value. Should be https://test-example-cri.gov.uk/notification but found https://something-else.com/something',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' does not match the test harness URL", async () => {
    const metadata = metadataBuilder().withOverrides({
      authorization_servers: ["https://something-else.com/"],
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "jwt"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "authorization_servers" value. Should contain https://test-auth-server.gov.uk but only contains https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'mdoc_iacas_uri' is missing - mDOC credential", async () => {
    const metadata = metadataBuilder().withDefaults();
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "mdoc"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "mdoc_iacas_uri" value. Should be https://test-example-cri.gov.uk/iacas but found undefined',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'mdoc_iacas_uri' does not match CRI's IACAs endpoint - mDOC credential", async () => {
    const metadata = metadataBuilder().withOverrides({
      mdoc_iacas_uri: "https://something-else.com/something",
    });
    await expect(
      isValidMetadata(metadata, criUrl, authServerUrl, "mdoc"),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "mdoc_iacas_uri" value. Should be https://test-example-cri.gov.uk/iacas but found https://something-else.com/something',
    );
  });
});

function metadataBuilder<T>(): {
  withDefaults();
  withOverrides(overrides: T);
} {
  const defaults = {
    credential_endpoint: criUrl + "/credential",
    authorization_servers: [authServerUrl],
    credential_issuer: criUrl,
    credential_configurations_supported: {
      DummyCredential: {
        format: "jwt_vc_json",
        types: ["VerifiableCredential", "DummyCredential"],
      },
    },
  };
  return {
    withDefaults() {
      return { ...defaults };
    },
    withOverrides(overrides: T) {
      return { ...defaults, ...overrides };
    },
  };
}
