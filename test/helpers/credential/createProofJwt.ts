import { importJWK, SignJWT, JWK, JWTPayload } from "jose";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bs58 = require("bs58");

const SIGNING_ALGORITHM = "ES256";

export async function createProofJwt(
  nonce: string,
  preAuthorizedCodePayload: JWTPayload,
  privateKeyJwk: JWK,
  publicKeyJwk: JWK,
): Promise<string> {
  const publicKey = getPublicKeyFromJwk(publicKeyJwk);
  const compressedPublicKey = compress(publicKey);
  const didKey = createDidKey(compressedPublicKey);

  const signingKeyAsKeyLike = await importJWK(privateKeyJwk, SIGNING_ALGORITHM);

  return await new SignJWT({ nonce: nonce })
    .setProtectedHeader({ alg: SIGNING_ALGORITHM, kid: didKey })
    .setIssuedAt()
    .setIssuer(preAuthorizedCodePayload.aud! as string)
    .setAudience(preAuthorizedCodePayload.iss!)
    .sign(signingKeyAsKeyLike);
}

function getPublicKeyFromJwk(publicKeyJwk: JWK) {
  return Buffer.concat([
    Buffer.from(publicKeyJwk.x!, "base64"),
    Buffer.from(publicKeyJwk.y!, "base64"),
  ]);
}

export const compress = (publicKey: Uint8Array): Uint8Array => {
  const publicKeyHex = Buffer.from(publicKey).toString("hex");
  const xHex = publicKeyHex.slice(0, publicKeyHex.length / 2);
  const yHex = publicKeyHex.slice(publicKeyHex.length / 2, publicKeyHex.length);
  const xOctet = Uint8Array.from(Buffer.from(xHex, "hex"));
  const yOctet = Uint8Array.from(Buffer.from(yHex, "hex"));
  return compressEcPoint(xOctet, yOctet);
};

function compressEcPoint(x: Uint8Array, y: Uint8Array) {
  const compressedKey = new Uint8Array(x.length + 1);
  compressedKey[0] = 2 + (y[y.length - 1] & 1);

  compressedKey.set(x, 1);
  return compressedKey;
}

function createDidKey(publicKey: Uint8Array) {
  const bytes = new Uint8Array(publicKey.length + 2);
  bytes[0] = 0x80;
  bytes[1] = 0x24;
  bytes.set(publicKey, 2);

  const bufAsString = bs58.encode(bytes);
  return `did:key:z${bufAsString}`;
}
