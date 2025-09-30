export function wwwAuthenticateHeaderContainsCorrectError(
  header: string,
): boolean {
  const headerString = Array.isArray(header) ? header.join(", ") : header;
  const normalisedHeader = headerString.trim();
  if (!normalisedHeader.startsWith("Bearer")) return false;

  return normalisedHeader.includes('error="invalid_token"');
}
