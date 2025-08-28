import { getAjvInstance } from "../../ajv/ajvInstance";
import { decode, Tag } from "cbor2";
import { domesticNamespaceSchema } from "./domesticNamespaceSchema";
import { issuerSignedSchema } from "./issuedSignedSchema";
import { isoNamespaceSchema } from "./isoNamespaceSchema";
import { base64url } from "jose";
const { X509Certificate } = require("node:crypto");

type NameSpace = typeof NAMESPACES.ISO | typeof NAMESPACES.GB;

type IssuerAuth = [Uint8Array, Map<33, Uint8Array>, Uint8Array, Uint8Array];

interface IssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, IssuerSignedItem[]>;
}

interface IssuerSignedItem {
  digestID: number;
  elementIdentifier: string;
  elementValue: string | boolean | Uint8Array | DrivingPrivileges[];
  random: Uint8Array;
}

interface DrivingPrivileges {
  vehicleCategoryCode: string;
  issue_date?: string;
  expiry_date?: string;
}

interface TaggedIssuerSignedItem {
  digestId: number;
  elementIdentifier: string;
  elementValue: string | boolean | Uint8Array | TaggedDrivingPrivileges[] | Tag;
  random: Uint8Array;
}

interface TaggedIssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, Tag[]>;
}

interface TaggedDrivingPrivileges {
  vehicleCategoryCode: string;
  issue_date?: Tag;
  expiry_date?: Tag;
}

export const NAMESPACES = {
  /** ISO 18013-5 standard namespace */
  ISO: "org.iso.18013.5.1",
  /** UK domestic namespace */
  GB: "org.iso.18013.5.1.GB",
} as const;

export const CBOR_TAGS = {
  /** Tag for CBOR-encoded data */
  ENCODED_CBOR_DATA: 24,
  /** Tag for full-date strings */
  FULL_DATE: 1004,
} as const;

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
] as const;

const FULL_DATE_ELEMENTS = ["birth_date", "issue_date", "expiry_date"] as const;

const DRIVING_PRIVILEGES_ELEMENTS = [
  "driving_privileges",
  "provisional_driving_privileges",
] as const;

const TAGS = new Map([
  [
    CBOR_TAGS.ENCODED_CBOR_DATA,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ({ contents }: { contents: any }) => decode(contents, { tags: TAGS }),
  ],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [CBOR_TAGS.FULL_DATE, ({ contents }: { contents: any }) => contents],
]);

export class MDLValidationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "VALIDATION_FAILED") {
    super(message);
    this.name = "MDLValidationError";
    this.code = code;
  }
}

/**
 * Validates a base64url-encoded mDL credential string.
 *
 * This includes decoding the credential from base64url, validating its
 *  CBOR tags, schema, required elements, image format, and digest IDs.
 *
 * @param credential - The base64url-encoded credential string.
 * @returns true if the credential is valid; otherwise, throws an error.
 */
export function isValidCredential(credential: string): boolean {
  const cborBytes = base64UrlToUint8Array(credential);

  /*
  We intentionally decode the SAME CBOR payload twice.
  1. decodeCredential(cborBytes)         → preserves CBOR tags
  (used in validateCborTags to check correct tagging compliance)

  2. decodeCredential(cborBytes, TAGS)   → normalises/removes CBOR tags
  (used in decodeCredential to produce a usable IssuerSigned object)

  This may seem redundant, but it's required:
  - The first decode ensures that required CBOR tags are present and valid.
  - The second decode converts tagged structures into plain JavaScript values.

  Skipping either step would either leave tag data unchecked, or produce objects that are harder to validate.
  */
  const taggedIssuerSigned = decodeCredential(cborBytes);
  validateCborTags(taggedIssuerSigned);

  const issuerSigned = decodeCredential(cborBytes, TAGS);
  validateIssuerSignedSchema(issuerSigned);
  validateRequiredElements(issuerSigned);
  validateDigestIdsUnique(issuerSigned.nameSpaces);
  const portrait = extractPortrait(issuerSigned);
  validatePortraitFormat(portrait);

  const protectedHeader = decode(issuerSigned.issuerAuth[0]);
  validateCoseProtectedHeader(protectedHeader);

  const unprotectedHeader = issuerSigned.issuerAuth[1];
  console.log(unprotectedHeader);
  validateCoseUnprotectedHeader(unprotectedHeader);

  return true;
}

function base64UrlToUint8Array(data: string): Uint8Array {
  try {
    return new Uint8Array(base64url.decode(data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Invalid base64url encoding - ${errorMessage}`,
      "INVALID_BASE64URL",
    );
  }
}

function decodeCredential(
  credential: Uint8Array<ArrayBufferLike>,
): TaggedIssuerSigned;

function decodeCredential(
  credential: Uint8Array<ArrayBufferLike>,
  tags: Map<number, (value: any) => any>,
): IssuerSigned;

function decodeCredential(
  credential: Uint8Array<ArrayBufferLike>,
  tags?: Map<number, (value: any) => any>,
): unknown | IssuerSigned {
  try {
    return decode(credential, tags ? { tags } : undefined);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Failed to decode CBOR data - ${errorMessage}`,
      "CBOR_DECODE_ERROR",
    );
  }
}

/**
 * Decode the credential with tags preserved in order to validate the tags.
 *
 * We do NOT strip tags here — we want to keep the CBOR tagging so we can
 * confirm the credential is tagged according to the mDL specification.
 *
 * This does not produce a usable IssuerSigned object — we only inspect
 * the tags, then discard the result.
 */
function validateCborTags(taggedIssuerSigned: TaggedIssuerSigned): void {
  try {
    for (const [namespaceName, elements] of Object.entries(
      taggedIssuerSigned.nameSpaces,
    )) {
      for (const element of elements) {
        validateEncodedCborData(element, namespaceName);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Failed to decode CBOR data - ${errorMessage}`,
      "CBOR_TAG_VALIDATION_ERROR",
    );
  }
}

function validateEncodedCborData(element: Tag, namespaceName: string): void {
  if (element.tag !== CBOR_TAGS.ENCODED_CBOR_DATA) {
    throw new MDLValidationError(
      `IssuerSignedItem in namespace '${namespaceName}' is not CBOR encoded - missing tag ${CBOR_TAGS.ENCODED_CBOR_DATA}`,
      "MISSING_CBOR_TAG",
    );
  }

  const decodedItem = decode(
    element.contents as string,
  ) as TaggedIssuerSignedItem;

  if (FULL_DATE_ELEMENTS.includes(decodedItem.elementIdentifier as any)) {
    if (
      !(decodedItem.elementValue instanceof Tag) ||
      decodedItem.elementValue.tag !== CBOR_TAGS.FULL_DATE
    ) {
      throw new MDLValidationError(
        `'${decodedItem.elementIdentifier}' missing tag ${CBOR_TAGS.FULL_DATE}`,
        "INVALID_DATE_TAG",
      );
    }
  }

  if (
    DRIVING_PRIVILEGES_ELEMENTS.includes(decodedItem.elementIdentifier as any)
  ) {
    const privileges = decodedItem.elementValue as TaggedDrivingPrivileges[];

    for (const privilege of privileges) {
      if (
        privilege.issue_date &&
        privilege.issue_date.tag !== CBOR_TAGS.FULL_DATE
      ) {
        throw new MDLValidationError(
          `'issue_date' in '${decodedItem.elementIdentifier}' missing tag ${CBOR_TAGS.FULL_DATE}`,
          "INVALID_DATE_TAG",
        );
      }

      if (
        privilege.expiry_date &&
        privilege.expiry_date.tag !== CBOR_TAGS.FULL_DATE
      ) {
        throw new MDLValidationError(
          `'expiry_date' in '${decodedItem.elementIdentifier}' missing tag ${CBOR_TAGS.FULL_DATE}`,
          "INVALID_DATE_TAG",
        );
      }
    }
  }
}

function validateIssuerSignedSchema(issuerSigned: IssuerSigned): void {
  const ajv = getAjvInstance();

  const validator = ajv
    .addSchema(isoNamespaceSchema, "isoNamespace")
    .addSchema(domesticNamespaceSchema, "domesticNamespace")
    .compile(issuerSignedSchema);

  if (!validator(issuerSigned)) {
    const errors =
      validator.errors?.map((error) => ({
        path: error.instancePath || "root",
        message: error.message || "Unknown validation error",
        value: error.data,
        keyword: error.keyword,
      })) || [];

    const errorDetails = errors
      .map((err) => `${err.path}: ${err.message}`)
      .join("; ");

    throw new MDLValidationError(
      `IssuerSigned does not comply with schema - ${errorDetails}`,
      "SCHEMA_VALIDATION_ERROR",
    );
  }
}

function validateRequiredElements(issuerSigned: IssuerSigned): void {
  const allItems: IssuerSignedItem[] = [
    ...(issuerSigned.nameSpaces[NAMESPACES.ISO] || []),
    ...(issuerSigned.nameSpaces[NAMESPACES.GB] || []),
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
  return portraitIssuerSignedItem.elementValue as Uint8Array<ArrayBufferLike>;
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

function validateDigestIdsUnique(
  namespaces: Record<NameSpace, IssuerSignedItem[]>,
) {
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

function validateCoseProtectedHeader(protectedHeader: unknown): void {
  if (!(protectedHeader instanceof Map)) {
    throw new MDLValidationError(
      "Protected header is not a Map",
      "INVALID_PROTECTED_HEADER",
    );
  }
  if (protectedHeader.size !== 1) {
    throw new Error("Protected header contains unexpected extra parameters.");
  }
  if (!protectedHeader.has(1)) {
    throw new MDLValidationError(
      'Protected header missing required "alg" (key 1)',
      "INVALID_PROTECTED_HEADER",
    );
  }
  if (protectedHeader.get(1) !== -7) {
    throw new MDLValidationError(
      'Protected header "alg" must be -7 (ES256)',
      "INVALID_PROTECTED_HEADER",
    );
  }
}

function validateCoseUnprotectedHeader(unprotectedHeader: unknown): void {
  if (!(unprotectedHeader instanceof Map)) {
    throw new MDLValidationError(
      "Unprotected header is not a Map",
      "INVALID_UNPROTECTED_HEADER",
    );
  }
  if (!unprotectedHeader.has(33)) {
    throw new MDLValidationError(
      'Protected header missing required "x5chain" (key 33)',
      "INVALID_UNPROTECTED_HEADER",
    );
  }

  const certificateBytes = unprotectedHeader.get(33);

  try {
    new X509Certificate(certificateBytes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Failed to parse X509Certificate - ${errorMessage}`,
      "INVALID_UNPROTECTED_HEADER",
    );
  }
}
