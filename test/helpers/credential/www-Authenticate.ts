export const WWW_AUTHENTICATE_REGEX =
  /^Bearer(?: realm="[^"]+")? error="invalid_token"$/;

export function matchesWwwAuthenticate(header: string): boolean {
  return WWW_AUTHENTICATE_REGEX.test(header);
}
