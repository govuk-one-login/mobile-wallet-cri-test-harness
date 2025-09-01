import { NAMESPACES } from "./constants/namespaces";
import { IssuerSigned, IssuerSignedItem } from "./types/issuerSigned";
import { NameSpace } from "./types/namespaces";
import { MDLValidationError } from "./MDLValidationError";

const REQUIRED_MDL_ELEMENTS = [
  "welsh_licence",
  "title",
  "family_name",
  "given_name",
  "portrait",
  "birth_date",
  "age_over_18",
  "age_over_21",
  "age_over_25",
  "birth_place",
  "issue_date",
  "expiry_date",
  "issuing_authority",
  "issuing_country",
  "document_number",
  "resident_address",
  "resident_postal_code",
  "resident_city",
  "driving_privileges",
  "un_distinguishing_sign",
];

export function validaNamespaces(issuerSigned: IssuerSigned) {
  validateRequiredElements(issuerSigned.nameSpaces);

  validateDigestIds(issuerSigned.nameSpaces);

  const portrait = extractPortrait(issuerSigned);
  validatePortraitFormat(portrait);
}

function validateRequiredElements(
  namespaces: Record<NameSpace, IssuerSignedItem[]>,
): void {
  const allItems: IssuerSignedItem[] = [
    ...(namespaces[NAMESPACES.ISO] || []),
    ...(namespaces[NAMESPACES.GB] || []),
  ];

  const presentElements = new Set(
    allItems.map((item) => item.elementIdentifier),
  );

  const missingElements = REQUIRED_MDL_ELEMENTS.filter(
    (element) => !presentElements.has(element),
  );

  if (missingElements.length > 0) {
    throw new MDLValidationError(
      `Missing required elements: ${missingElements.join(", ")}`,
      "MISSING_REQUIRED_ELEMENTS",
    );
  }
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
  const penultimateByte = data[data.length - 2];
  const lastByte = data[data.length - 1];
  if (!(penultimateByte === 0xff && lastByte === 0xd9)) {
    throw new MDLValidationError(
      `Invalid EOI - JPEG should end with ffd9 but found ${Buffer.from([penultimateByte, lastByte]).toString("hex")}`,
      "INVALID_PORTRAIT",
    );
  }
}

function validateDigestIds(namespaces: Record<NameSpace, IssuerSignedItem[]>) {
  const namespacesToCheck = [NAMESPACES.ISO, NAMESPACES.GB];

  namespacesToCheck.forEach((namespace) => {
    const digestIds = namespaces[namespace]?.map((item) => item.digestID);

    if (!checkUnique(digestIds)) {
      throw new MDLValidationError(
        `Digest IDs are not unique for namespace ${namespace}`,
        "INVALID_DIGEST_IDS",
      );
    }
  });
}

function checkUnique(digestIds: number[]): boolean {
  return new Set(digestIds).size === digestIds.length;
}
