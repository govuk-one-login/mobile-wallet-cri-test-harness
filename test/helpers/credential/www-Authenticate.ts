export function wwwAuthenticateHeaderContainsCorrectError(
  header: string,
): boolean {
  if (!header.startsWith("Bearer")) return false;
  return header.includes('error="invalid_token"');
}
