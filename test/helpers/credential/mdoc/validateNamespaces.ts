import { NAMESPACES } from "./constants/namespaces";
import { IssuerSigned, IssuerSignedItem } from "./types/issuerSigned";
import { NameSpace } from "./types/namespaces";
import { MDLValidationError } from "./MDLValidationError";

export function validaNamespaces(issuerSigned: IssuerSigned) {
  validateDigestIds(issuerSigned.nameSpaces);

  const portrait = extractPortrait(issuerSigned);
  validatePortraitFormat(portrait);
}

function extractPortrait(
  issuerSigned: IssuerSigned,
): Uint8Array<ArrayBufferLike> {
  const portraitIssuerSignedItem = issuerSigned.nameSpaces[NAMESPACES.ISO].find(
    (item) => item.elementIdentifier === "portrait",
  )!;
  return portraitIssuerSignedItem.elementValue as Uint8Array;
}

function validatePortraitFormat(data: Uint8Array): void {
  // Check for SOI (Start of Image) marker: 0xFF 0xD8 0xE0 (or 0xEE or 0xDB)
  const byte1 = data[0];
  const byte2 = data[1];
  const byte3 = data[2];
  const byte4 = data[3];

  if (
    byte1 !== 0xff ||
    byte2 !== 0xd8 ||
    byte3 !== 0xff ||
    ![0xe0, 0xee, 0xdb].includes(byte4)
  ) {
    throw new MDLValidationError(
      `Invalid SOI - JPEG should start with ffd8ffe0 or ffd8ffee or ffd8ffdb for JPEG but found ${Buffer.from([byte1, byte2, byte3, byte4]).toString("hex")}`,
      "INVALID_PORTRAIT",
    );
  }

  // Look for EOI (End of Image) marker: FF D9
  const penultimateByte = data.at(-2) ?? 0;
  const lastByte = data.at(-1) ?? 0;
  if (!(penultimateByte === 0xff && lastByte === 0xd9)) {
    throw new MDLValidationError(
      `Invalid EOI - JPEG should end with ffd9 but found ${Buffer.from([penultimateByte, lastByte]).toString("hex")}`,
      "INVALID_PORTRAIT",
    );
  }
}

function validateDigestIds(namespaces: Record<NameSpace, IssuerSignedItem[]>) {
  const namespacesToCheck = [NAMESPACES.ISO, NAMESPACES.GB];

  for (const namespace of namespacesToCheck) {
    const digestIds = namespaces[namespace]?.map((item) => item.digestID);

    if (!checkUnique(digestIds)) {
      throw new MDLValidationError(
        `Digest IDs are not unique for namespace ${namespace}`,
        "INVALID_DIGEST_IDS",
      );
    }
  }
}

function checkUnique(digestIds: number[]): boolean {
  return new Set(digestIds).size === digestIds.length;
}
