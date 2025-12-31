import { isValidMetadata } from "./isValidMetadata";

const authServerUrl = "https://test-auth-server.gov.uk";
const criUrl = "https://test-example-cri.gov.uk";
const credentialConfigurationId = "TestCredential";

describe("isValidMetadata", () => {
  it("should throw 'INVALID_METADATA' error when metadata does not comply with schema", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_configurations_supported: false,
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      "INVALID_METADATA: Metadata does not comply with the schema.",
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_issuer' is invalid", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_issuer: "https://something-else.com/",
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "credential_issuer" value. Should be https://test-example-cri.gov.uk but found https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'authorization_servers' is invalid", async () => {
    const metadata = metadataBuilder().withOverrides({
      authorization_servers: ["https://something-else.com/"],
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "authorization_servers" value. Should contain https://test-auth-server.gov.uk but only contains https://something-else.com/',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'credential_endpoint' is invalid", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_endpoint: "https://something-else.com/something",
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "credential_endpoint" value. Should be https://test-example-cri.gov.uk/credential but found https://something-else.com/something',
    );
  });

  it("should throw 'INVALID_METADATA' error when credential is not in 'credential_configurations_supported'", async () => {
    const metadata = metadataBuilder().withOverrides({
      credential_configurations_supported: {
        AnotherCredential: {
          format: "mso_mdoc",
          doctype: "AnotherCredential",
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      },
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "credential_configurations_supported" value. Missing credential TestCredential',
    );
  });

  it("should throw 'INVALID_METADATA' error when 'notification_endpoint' is invalid", async () => {
    const metadata = metadataBuilder().withOverrides({
      notification_endpoint: "https://something-else.com/something",
    });

    await expect(
      isValidMetadata(
        metadata,
        criUrl,
        authServerUrl,
        "jwt",
        credentialConfigurationId,
      ),
    ).rejects.toThrow(
      'INVALID_METADATA: Invalid "notification_endpoint" value. Should be https://test-example-cri.gov.uk/notification but found https://something-else.com/something',
    );
  });

  describe("given the credential format is mDOC", () => {
    it("should throw 'INVALID_METADATA' error when 'mdoc_iacas_uri' is missing", async () => {
      const metadata = metadataBuilder().withDefaults();

      await expect(
        isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "mdoc",
          credentialConfigurationId,
        ),
      ).rejects.toThrow(
        'INVALID_METADATA: Invalid "mdoc_iacas_uri" value. Should be https://test-example-cri.gov.uk/iacas but found undefined',
      );
    });

    it("should throw 'INVALID_METADATA' error when 'mdoc_iacas_uri' is invalid", async () => {
      const metadata = metadataBuilder().withOverrides({
        mdoc_iacas_uri: "https://something-else.com/something",
      });

      await expect(
        isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "mdoc",
          credentialConfigurationId,
        ),
      ).rejects.toThrow(
        'INVALID_METADATA: Invalid "mdoc_iacas_uri" value. Should be https://test-example-cri.gov.uk/iacas but found https://something-else.com/something',
      );
    });

    it("should return true when metadata is valid", async () => {
      const metadata = metadataBuilder().withOverrides({
        mdoc_iacas_uri: "https://test-example-cri.gov.uk/iacas",
      });

      expect(
        await isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "mdoc",
          credentialConfigurationId,
        ),
      ).toEqual(true);
    });
  });

  describe("given the credential format is JWT", () => {
    it("should return true when metadata is valid", async () => {
      const metadata = metadataBuilder().withDefaults();

      expect(
        await isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "jwt",
          credentialConfigurationId,
        ),
      ).toEqual(true);
    });
  });

  describe("given the metadata contains 'notification_endpoint'", () => {
    it("should return false when 'notification_endpoint' is invalid", async () => {
      const metadata = metadataBuilder().withOverrides({
        notification_endpoint:
          "https://test-example-cri.gov.uk/invalid-notification-path",
      });

      await expect(
        isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "mdoc",
          credentialConfigurationId,
        ),
      ).rejects.toThrow(
        'INVALID_METADATA: Invalid "notification_endpoint" value. Should be https://test-example-cri.gov.uk/notification but found https://test-example-cri.gov.uk/invalid-notification-path',
      );
    });

    it("should return true when 'notification_endpoint' is valid", async () => {
      const metadata = metadataBuilder().withOverrides({
        notification_endpoint: "https://test-example-cri.gov.uk/notification",
      });

      expect(
        await isValidMetadata(
          metadata,
          criUrl,
          authServerUrl,
          "jwt",
          credentialConfigurationId,
        ),
      ).toEqual(true);
    });
  });
});

function metadataBuilder<T>(): {
  withDefaults();
  withOverrides(overrides: T);
} {
  const defaults = {
    credential_issuer: criUrl,
    authorization_servers: [authServerUrl],
    credential_endpoint: criUrl + "/credential",
    credential_configurations_supported: {
      TestCredential: {
        format: "mso_mdoc",
        doctype: "TestCredential",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
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
