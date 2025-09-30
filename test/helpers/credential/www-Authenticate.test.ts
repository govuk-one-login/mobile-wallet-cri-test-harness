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
  });
});
