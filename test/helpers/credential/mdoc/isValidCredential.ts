import { getAjvInstance } from "../../ajv/ajvInstance";
import { decode, Tag } from "cbor2";
import { domesticNamespaceSchema } from "./domesticNamespaceSchema";
import { issuerSignedSchema } from "./issuedSignedSchema";
import { isoNamespaceSchema } from "./isoNamespaceSchema";

export const NAMESPACES = {
  /** ISO 18013-5 standard namespace */
  ISO: "org.iso.18013.5.1",
  /** UK domestic namespace */
  GB: "org.iso.18013.5.1.GB",
} as const;

export const CBOR_TAGS = {
  /** Tag for CBOR-encoded data */
  ENCODED_CBOR: 24,
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

interface DrivingPrivilegesWithTags {
  vehicleCategoryCode: string;
  issue_date?: Tag;
  expiry_date?: Tag;
}

interface DrivingPrivileges {
  vehicleCategoryCode: string;
  issue_date?: string;
  expiry_date?: string;
}

interface IssuerSignedItemWithTags {
  digestId: number;
  elementIdentifier: string;
  elementValue:
    | string
    | boolean
    | Uint8Array
    | DrivingPrivilegesWithTags[]
    | Tag;
  random: Uint8Array;
}

interface IssuerSignedItem {
  digestId: number;
  elementIdentifier: string;
  elementValue: string | boolean | Uint8Array | DrivingPrivileges[];
  random: Uint8Array;
}

type NameSpace = typeof NAMESPACES.ISO | typeof NAMESPACES.GB;

type IssuerAuth = [Uint8Array, Map<33, Uint8Array>, Uint8Array, Uint8Array];

export interface IssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, IssuerSignedItem[]>;
}

export class MDLValidationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "VALIDATION_FAILED") {
    super(message);
    this.name = "MDLValidationError";
    this.code = code;
  }
}

function isValidBase64Url(input: string): boolean {
  if (!input) {
    return false;
  }
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
  return base64UrlPattern.test(input);
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function decodeCredential(
  credential: Uint8Array<ArrayBufferLike>,
): IssuerSigned {
  try {
    const tags = new Map([
      [
        CBOR_TAGS.ENCODED_CBOR,
        ({ contents }: { contents: any }) => decode(contents, { tags }),
      ],
      [CBOR_TAGS.FULL_DATE, ({ contents }: { contents: any }) => contents],
    ]);
    return decode(credential, { tags }) as IssuerSigned;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Failed to decode CBOR data - ${errorMessage}`,
      "CBOR_DECODE_ERROR",
    );
  }
}

function validateCborTags(credential: Uint8Array<ArrayBufferLike>): void {
  try {
    const issuerSigned: {
      issuerAuth: IssuerAuth;
      nameSpaces: Record<NameSpace, Tag[]>;
    } = decode(credential);

    for (const [namespaceName, elements] of Object.entries(
      issuerSigned.nameSpaces,
    )) {
      for (const element of elements) {
        validateEncodedCbor(element, namespaceName);
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

function validateEncodedCbor(element: Tag, namespaceName: string): void {
  if (element.tag !== CBOR_TAGS.ENCODED_CBOR) {
    throw new MDLValidationError(
      `IssuerSignedItem in namespace '${namespaceName}' is not CBOR encoded - missing tag ${CBOR_TAGS.ENCODED_CBOR}`,
      "MISSING_CBOR_TAG",
    );
  }

  const decodedItem = decode(
    element.contents as string,
  ) as IssuerSignedItemWithTags;

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
    const privileges = decodedItem.elementValue as DrivingPrivilegesWithTags[];

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

export function isValidCredential(credential: string): boolean {
  if (!isValidBase64Url(credential)) {
    throw new MDLValidationError(
      "Invalid base64url encoding",
      "INVALID_BASE64URL",
    );
  }

  const cborBytes = base64UrlToUint8Array(credential);

  const issuerSigned = decodeCredential(cborBytes);

  validateCborTags(cborBytes);

  validateIssuerSignedSchema(issuerSigned);

  validateRequiredElements(issuerSigned);

  return true;
}
