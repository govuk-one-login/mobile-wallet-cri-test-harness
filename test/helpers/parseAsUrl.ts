export function parseAsUrl(urlString: string): URL {
  try {
    return new URL(urlString);
  } catch (error) {
    console.log(error);
    throw new Error("INVALID_URL");
  }
}
