import { getAjvInstance } from "../ajv/ajvInstance";
import { credentialConfigurationsSupportedSchema } from "./credentialConfigurationsSupportedSchema";

describe("credentialConfigurationsSupportedSchema", () => {
  const ajv = getAjvInstance();
  const validate = ajv.compile(credentialConfigurationsSupportedSchema);

  it("should return false if 'format' is missing", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/org.iso.18013.5.1.mDL",
        message: "must have required property 'format'",
      }),
    );
  });

  it("should return false if 'format' is neither 'jwt_vc_json' nor 'mso_mdoc'", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "unknown_format",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/org.iso.18013.5.1.mDL/format",
        params: { allowedValues: ["jwt_vc_json", "mso_mdoc"] },
        message: "must be equal to one of the allowed values",
      }),
    );
  });

  it("should return false if 'cryptographic_binding_methods_supported' is missing", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/org.iso.18013.5.1.mDL",
        message:
          "must have required property 'cryptographic_binding_methods_supported'",
      }),
    );
  });

  it("should return false if 'cryptographic_binding_methods_supported' is empty", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: [],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath:
          "/org.iso.18013.5.1.mDL/cryptographic_binding_methods_supported",
        message: "must NOT have fewer than 1 items",
      }),
    );
  });

  it("should return false if 'credential_signing_alg_values_supported' is missing", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/org.iso.18013.5.1.mDL",
        message:
          "must have required property 'credential_signing_alg_values_supported'",
      }),
    );
  });

  it("should return false if 'credential_signing_alg_values_supported' is empty", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: [],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath:
          "/org.iso.18013.5.1.mDL/credential_signing_alg_values_supported",
        message: "must NOT have fewer than 1 items",
      }),
    );
  });

  it("should return false if 'credential_signing_alg_values_supported' does not contain 'ES256'", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["RS256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath:
          "/org.iso.18013.5.1.mDL/credential_signing_alg_values_supported",
        message: "must contain at least 1 valid item(s)",
      }),
    );
  });

  it("should return false if 'credential_validity_period_max_days' is missing", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/org.iso.18013.5.1.mDL",
        message:
          "must have required property 'credential_validity_period_max_days'",
      }),
    );
  });

  it("should return false if 'credential_validity_period_max_days' is not a number", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: "30",
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath:
          "/org.iso.18013.5.1.mDL/credential_validity_period_max_days",
        message: "must be number",
      }),
    );
  });

  it("should return true if there are additional properties", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
        extra_property: "allowed",
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(true);
  });

  it("should return true if 'cryptographic_binding_methods_supported' has more than one item", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key", "extra"],
        credential_signing_alg_values_supported: ["ES256"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(true);
  });

  it("should return true if 'credential_signing_alg_values_supported' has more than one item", () => {
    const data = {
      "org.iso.18013.5.1.mDL": {
        format: "mso_mdoc",
        doctype: "org.iso.18013.5.1.mDL",
        cryptographic_binding_methods_supported: ["cose_key"],
        credential_signing_alg_values_supported: ["ES256", "extra"],
        credential_validity_period_max_days: 30,
      },
    };

    const isValid = validate(data);

    expect(isValid).toBe(true);
  });

  describe("given it contains 'credential_refresh_web_journey_url'", () => {
    it("should return false if 'credential_refresh_web_journey_url' is not a valid URI", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          doctype: "org.iso.18013.5.1.mDL",
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
          credential_refresh_web_journey_url: "not-a-url",
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/org.iso.18013.5.1.mDL/credential_refresh_web_journey_url",
          message: 'must match format "uri"',
        }),
      );
    });

    it("should return true if 'credential_refresh_web_journey_url' is a valid URI", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          doctype: "org.iso.18013.5.1.mDL",
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
          credential_refresh_web_journey_url: "https://example.com/refresh",
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(true);
    });
  });

  describe("given 'format' is 'jwt_vc_json'", () => {
    it("should return false if missing 'proof_types_supported'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential",
          message: "must have required property 'proof_types_supported'",
        }),
      );
    });

    it("should return false if 'proof_types_supported' is missing 'jwt'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {},
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential/proof_types_supported",
          message: "must have required property 'jwt'",
        }),
      );
    });

    it("should return false if 'proof_types_supported.jwt' is missing 'proof_signing_alg_values_supported'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {},
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential/proof_types_supported/jwt",
          message:
            "must have required property 'proof_signing_alg_values_supported'",
        }),
      );
    });

    it("should return false if 'proof_types_supported.jwt.proof_signing_alg_values_supported' is empty", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: [],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/SocialSecurityCredential/proof_types_supported/jwt/proof_signing_alg_values_supported",
          message: "must NOT have fewer than 1 items",
        }),
      );
    });

    it("should return false if 'proof_types_supported.jwt.proof_signing_alg_values_supported' does not contain 'ES256'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["RS256", "ES384"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/SocialSecurityCredential/proof_types_supported/jwt/proof_signing_alg_values_supported",
          message: "must contain at least 1 valid item(s)",
        }),
      );
    });

    it("should return false if missing 'credential_definition'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential",
          message: "must have required property 'credential_definition'",
        }),
      );
    });

    it("should return false if 'credential_definition.type' has less than two items", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential/credential_definition/type",
          message: "must NOT have fewer than 2 items",
        }),
      );
    });

    it("should return false if 'credential_definition.type' has more than two items", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential", "Extra"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential/credential_definition/type",
          message: "must NOT have more than 2 items",
        }),
      );
    });

    it("should return false if 'credential_definition.type' is missing 'VerifiableCredential'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["SomethingElse", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/SocialSecurityCredential/credential_definition/type",
          message: "must contain at least 1 valid item(s)",
        }),
      );
    });

    it("should return false if 'credential_definition.type' contains non-string values", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", 123],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/SocialSecurityCredential/credential_definition/type/1",
          message: "must be string",
        }),
      );
    });

    it("should return false if 'cryptographic_binding_methods_supported' is not 'did:key'", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          cryptographic_binding_methods_supported: ["something_else"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/SocialSecurityCredential/cryptographic_binding_methods_supported/0",
          params: { allowedValue: "did:key" },
          message: "must be equal to constant",
        }),
      );
    });

    it("should return true if configuration is valid", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(true);
    });

    it("should return true when 'proof_signing_alg_values_supported' has more than one item", () => {
      const data = {
        SocialSecurityCredential: {
          format: "jwt_vc_json",
          credential_definition: {
            type: ["VerifiableCredential", "SocialSecurityCredential"],
          },
          proof_types_supported: {
            jwt: {
              proof_signing_alg_values_supported: ["ES256", "RS256"],
            },
          },
          cryptographic_binding_methods_supported: ["did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(true);
    });
  });

  describe("given 'format' is 'mso_mdoc'", () => {
    it("should return false if missing 'doctype'", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/org.iso.18013.5.1.mDL",
          message: "must have required property 'doctype'",
        }),
      );
    });

    it("should return false if 'doctype' is not a string", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          doctype: 1,
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/org.iso.18013.5.1.mDL/doctype",
          message: "must be string",
        }),
      );
    });

    it("should return false if 'cryptographic_binding_methods_supported' does not contain 'cose_key'", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          doctype: "org.iso.18013.5.1.mDL",
          cryptographic_binding_methods_supported: ["something_else"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };
      const isValid = validate(data);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath:
            "/org.iso.18013.5.1.mDL/cryptographic_binding_methods_supported/0",
          params: { allowedValue: "cose_key" },
          message: "must be equal to constant",
        }),
      );
    });

    it("should return true if configuration is valid", () => {
      const data = {
        "org.iso.18013.5.1.mDL": {
          format: "mso_mdoc",
          doctype: "org.iso.18013.5.1.mDL",
          cryptographic_binding_methods_supported: ["cose_key"],
          credential_signing_alg_values_supported: ["ES256"],
          credential_validity_period_max_days: 30,
        },
      };

      const isValid = validate(data);

      expect(isValid).toBe(true);
    });
  });
});
