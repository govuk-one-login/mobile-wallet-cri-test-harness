import { wwwAuthenticateHeaderContainsCorrectError } from "./www-Authenticate";

describe("www-Authenticate", () => {
  it("should match without realm", () => {
    expect(
      wwwAuthenticateHeaderContainsCorrectError('Bearer error="invalid_token"'),
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
      wwwAuthenticateHeaderContainsCorrectError('Bearererror="invalid_token"'),
    ).toBe(false);
  });

  it("should not match if it does not start with Bearer", () => {
    expect(
      wwwAuthenticateHeaderContainsCorrectError(
        'realm="", error="invalid_token"',
      ),
    ).toBe(false);
  });

  it("should not match if error is different", () => {
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

  it("should match if it start with Bearer and have only realm", () => {
    expect(
      wwwAuthenticateHeaderContainsCorrectError(
        'Bearer realm="http://localhost:8000"',
      ),
    ).toBe(true);
  });

  it("should match if there are no parameter", () => {
    expect(wwwAuthenticateHeaderContainsCorrectError("Bearer")).toBe(true);
  });
});
