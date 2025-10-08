export function wwwAuthenticateHeaderContainsCorrectError(
  header: string,
): boolean {
  if (!header.startsWith("Bearer ")) return false;
  return /\berror="invalid_token"/.test(header);
}

export function wwwAuthenticateHeaderHasNoAuthentication(
  header: string,
): boolean {
  if (header.includes("error")) return false;
  return header === "Bearer" || header.startsWith("Bearer ");
}
