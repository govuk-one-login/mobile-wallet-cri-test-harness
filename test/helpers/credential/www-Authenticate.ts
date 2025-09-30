export function wwwAuthenticateHeaderContainsCorrectError(
  header: string,
): boolean {
  if (!header.startsWith("Bearer ")) return false;
  return /\berror="invalid_token"/.test(header);
}
