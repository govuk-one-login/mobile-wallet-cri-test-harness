import { getAjvInstance } from "../../ajv/ajvInstance";
import { decode, Tag } from "cbor2";
import { domesticNamespaceSchema } from "./domesticNamespaceSchema";
import { issuerSignedSchema } from "./issuedSignedSchema";
import { isoNamespaceSchema } from "./isoNamespaceSchema";
import { base64url } from "jose";
import "cbor2/types";
import { validateTags } from "./validateTags";
import { validateIssuerAuth } from "./validateIssuerAuth";
import { CBOR_TAGS } from "./tags";
import { validaNamespaces } from "./validateNamespaces";

export type NameSpace = typeof NAMESPACES.ISO | typeof NAMESPACES.GB;

export type IssuerAuth = [
  Uint8Array,
  Map<unknown, unknown>,
  Uint8Array,
  Uint8Array,
];

export interface DeviceKeyInfo {
  deviceKey: Map<unknown, unknown>;
  keyAuthorizations: {
    nameSpaces: ("org.iso.18013.5.1.GB" | "org.iso.18013.5.1")[];
  };
}

export interface ValueDigests {
  "org.iso.18013.5.1.GB": Map<unknown, unknown>;
  "org.iso.18013.5.1": Map<unknown, unknown>;
}

export interface MobileSecurityObject {
  version: "1.0";
  digestAlgorithm: "SHA-256";
  deviceKeyInfo: DeviceKeyInfo;
  valueDigests: ValueDigests;
  docType: "org.iso.18013.5.1.mDL";
  validityInfo: {
    signed: string;
    validFrom: string;
    validUntil: string;
  };
}
export interface IssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, IssuerSignedItem[]>;
}

export interface TaggedIssuerSigned extends Omit<IssuerSigned, "nameSpaces"> {
  nameSpaces: Record<NameSpace, Tag[]>;
}

export interface IssuerSignedItem {
  digestID: number;
  elementIdentifier: string;
  elementValue: string | boolean | Uint8Array | DrivingPrivileges[];
  random: Uint8Array;
}

export interface TaggedIssuerSignedItem
  extends Omit<IssuerSignedItem, "elementValue"> {
  elementValue: string | boolean | Uint8Array | TaggedDrivingPrivileges[] | Tag;
}

export interface DrivingPrivileges {
  vehicleCategoryCode: string;
  issue_date?: string;
  expiry_date?: string;
}

export interface TaggedDrivingPrivileges
  extends Omit<DrivingPrivileges, "issue_date" | "expiry_date"> {
  issue_date?: Tag;
  expiry_date?: Tag;
}

export const NAMESPACES = {
  /** ISO 18013-5 standard namespace */
  ISO: "org.iso.18013.5.1",
  /** UK domestic namespace */
  GB: "org.iso.18013.5.1.GB",
} as const;

const TAGS = new Map([
  [
    CBOR_TAGS.ENCODED_CBOR_DATA,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ({ contents }: { contents: any }) => decode(contents, { tags: TAGS }),
  ],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [CBOR_TAGS.FULL_DATE, ({ contents }: { contents: any }) => contents],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [CBOR_TAGS.DATE_TIME, ({ contents }: { contents: any }) => contents],
]);

export class MDLValidationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "VALIDATION_FAILED") {
    super(message);
    this.name = "MDLValidationError";
    this.code = code;
  }
}

Tag.registerDecoder(0, (tag) => new Tag(0, tag.contents));

/**
 * Validates a base64url-encoded mDL credential string.
 *
 * This includes decoding the credential from base64url, validating its
 *  CBOR tags, schema, required elements, image format, and digest IDs.
 *
 * @param credential - The base64url-encoded credential string.
 * @returns true if the credential is valid; otherwise, throws an error.
 */
export async function isValidCredential(credential: string): Promise<boolean> {
  const cborBytes = base64UrlToUint8Array(credential);

  /*
  We intentionally decode the SAME CBOR payload twice.
  1. cborDecoder(cborBytes)         → preserves CBOR tags
  (used in validateNamespacesCborTags to check correct tagging compliance)

  2. cborDecoder(cborBytes, TAGS)   → normalises/removes CBOR tags
  (used in cborDecoder to produce a usable IssuerSigned object)

  This may seem redundant, but it's required:
  - The first decode ensures that required CBOR tags are present and valid.
  - The second decode converts tagged structures into plain JavaScript values.

  Skipping either step would either leave tag data unchecked, or produce objects that are harder to validate.
  */
  const taggedIssuerSigned = issuerSignedDecoder(cborBytes);
  validateTags(taggedIssuerSigned);

  const issuerSigned = issuerSignedDecoder(cborBytes, TAGS);

  validateIssuerSignedSchema(issuerSigned);

  validaNamespaces(issuerSigned);

  await validateIssuerAuth(
    issuerSigned.issuerAuth,
    taggedIssuerSigned.nameSpaces,
  );

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

function issuerSignedDecoder(
  credential: Uint8Array<ArrayBufferLike>,
): TaggedIssuerSigned;

function issuerSignedDecoder(
  credential: Uint8Array<ArrayBufferLike>,
  tags: Map<number, (value: any) => any>,
): IssuerSigned;

function issuerSignedDecoder(
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
