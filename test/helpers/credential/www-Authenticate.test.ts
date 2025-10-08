import {
  wwwAuthenticateHeaderContainsCorrectError,
  wwwAuthenticateHeaderHasNoAuthentication,
} from "./www-Authenticate";

describe("www-Authenticate", () => {
  describe("wwwAuthenticateHeaderContainsCorrectError", () => {
    it("should match without realm", () => {
      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearer error="invalid_token"',
        ),
      ).toBe(true);
    });

    it("should match with realm", () => {
      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearer realm="CREDENTIAL_ISSUER_URL", error="invalid_token"',
        ),
      ).toBe(true);
    });

    it("should match if realm is empty", () => {
      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearer realm="", error="invalid_token"',
        ),
      ).toBe(true);
    });

    it("should not match if no space after Bearer", () => {
      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearererror="invalid_token"',
        ),
      ).toBe(false);
    });

    it("should not match if it does not start with Bearer", () => {
      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'realm="", error="invalid_token"',
        ),
      ).toBe(false);
    });

    it("should not match if error is missing or different", () => {
      expect(wwwAuthenticateHeaderContainsCorrectError('Bearer realm=""')).toBe(
        false,
      );

      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearer error="different error"',
        ),
      ).toBe(false);

      expect(
        wwwAuthenticateHeaderContainsCorrectError(
          'Bearer blaherror="invalid_token"',
        ),
      ).toBe(false);
    });
  });

  describe("wwwAuthenticateHeaderHasNoAuthentication", () => {
    it("should match if start with Bearer and have realm", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'Bearer realm="http://localhost:8000"',
        ),
      ).toBe(true);
    });

    it("should match if there are no parameter", () => {
      expect(wwwAuthenticateHeaderHasNoAuthentication("Bearer")).toBe(true);
    });

    it("should match if start with Bearer and have other parameters", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'Bearer realm="http://localhost:8000", scope="openid profile email"',
        ),
      ).toBe(true);
    });

    it("should not match if Bearer is missing", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'realm="http://localhost:8000"',
        ),
      ).toBe(false);
    });

    it("should not match if it start with Bearer with no space", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'Bearerrealm="http://localhost:8000"',
        ),
      ).toBe(false);
    });

    it("should not match if it contains error", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'Bearer realm="http://localhost:8000", error="invalid_token"',
        ),
      ).toBe(false);
    });

    it("should not match if it contains error_description", () => {
      expect(
        wwwAuthenticateHeaderHasNoAuthentication(
          'Bearer error_description="The access token expired"',
        ),
      ).toBe(false);
    });
  });
});
