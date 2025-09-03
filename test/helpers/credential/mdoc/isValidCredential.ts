import { decode, Tag } from "cbor2";
import { base64url } from "jose";
import "cbor2/types";
import { validateTags } from "./validateTags";
import { validateIssuerAuth } from "./validateIssuerAuth";
import { TAGS } from "./constants/tags";
import { validaNamespaces } from "./validateNamespaces";
import { errorMessage, MDLValidationError } from "./MDLValidationError";
import { IssuerSigned, TaggedIssuerSigned } from "./types/issuerSigned";
import { validateIssuerSignedSchema } from "./validateIssuerSigned";

/**
 * Validates a base64url-encoded mDL credential string.
 *
 * @param credential - The base64url-encoded credential string.
 * @returns true if the credential is valid; otherwise, throws an error.
 */
export async function isValidCredential(
  credential: string,
  rootCertificatePem: string,
): Promise<boolean> {
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
  const taggedIssuerSigned: TaggedIssuerSigned = issuerSignedDecoder(cborBytes);
  validateTags(taggedIssuerSigned);

  const issuerSigned: IssuerSigned = issuerSignedDecoder(cborBytes, tags);

  validateIssuerSignedSchema(issuerSigned);

  validaNamespaces(issuerSigned);

  await validateIssuerAuth(
    issuerSigned.issuerAuth,
    taggedIssuerSigned.nameSpaces,
    rootCertificatePem,
  );

  return true;
}

function base64UrlToUint8Array(data: string): Uint8Array {
  try {
    return new Uint8Array(base64url.decode(data));
  } catch (error) {
    throw new MDLValidationError(
      `Failed to decode base64url encoded credential - ${errorMessage(error)}`,
      "INVALID_BASE64URL",
    );
  }
}

/*
 * Override the default CBOR tag 0 (RFC3339 date/time string) decoder.
 * By default, data with tag 0 is automatically parsed into a JavaScript Date.
 * Registering this custom decoder instead wraps any tag 0 value in a Tag object,
 * preserving both the tag number (0) and its contents as-is.
 *
 * This allows for explicit verification that a given value was actually tagged with 0,
 * instead of being silently converted to a Date type.
 */
Tag.registerDecoder(0, (tag) => new Tag(0, tag.contents));

const tags = new Map([
  [
    TAGS.ENCODED_CBOR_DATA,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ({ contents }: { contents: any }) => decode(contents, { tags: tags }),
  ],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [TAGS.FULL_DATE, ({ contents }: { contents: any }) => contents],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [TAGS.DATE_TIME, ({ contents }: { contents: any }) => contents],
]);

function issuerSignedDecoder(credential: Uint8Array): TaggedIssuerSigned;

function issuerSignedDecoder(
  credential: Uint8Array,
  tags: Map<number, (value: any) => any>,
): IssuerSigned;

function issuerSignedDecoder(
  credential: Uint8Array,
  tags?: Map<number, (value: any) => any>,
): TaggedIssuerSigned | IssuerSigned {
  try {
    return decode(credential, tags ? { tags } : undefined);
  } catch (error) {
    throw new MDLValidationError(
      `Failed to decode CBOR encoded credential - ${errorMessage(error)}`,
      "INVALID_CBOR",
    );
  }
}
