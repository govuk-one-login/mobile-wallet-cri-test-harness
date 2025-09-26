import { matchesWwwAuthenticate } from "./www-Authenticate";

describe("www-Authenticate", () => {
  it("should match without realm", () => {
    expect(matchesWwwAuthenticate('Bearer error="invalid_token"')).toBe(true);
  });

  it("should match with realm", () => {
    expect(
      matchesWwwAuthenticate(
        'Bearer realm="CREDENTIAL_ISSUER_URL" error="invalid_token"',
      ),
    ).toBe(true);
  });

  it("should not match if realm is empty", () => {
    expect(
      matchesWwwAuthenticate('Bearer realm="" error="invalid_token"'),
    ).toBe(false);
  });
});
