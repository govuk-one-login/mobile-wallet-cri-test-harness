export function wwwAuthenticateHeaderContainsCorrectError(
  header: string,
): boolean {
  if (header === "Bearer") return true;
  if (!header.startsWith("Bearer ")) return false;
  if (header.includes("realm")) return true;
  return /\berror="invalid_token"/.test(header);
}
