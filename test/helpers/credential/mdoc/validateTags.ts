import { decode, Tag } from "cbor2";
import {
  MDLValidationError,
  MobileSecurityObject,
  TaggedDrivingPrivileges,
  TaggedIssuerSigned,
  TaggedIssuerSignedItem,
} from "./isValidCredential";
import { CBOR_TAGS } from "./tags";

const FULL_DATE_ELEMENTS = ["birth_date", "issue_date", "expiry_date"] as const;

const DRIVING_PRIVILEGES_ELEMENTS = [
  "driving_privileges",
  "provisional_driving_privileges",
] as const;

interface TaggedMobileSecurityObject
  extends Omit<MobileSecurityObject, "validityInfo"> {
  validityInfo: {
    signed: Tag;
    validFrom: Tag;
    validUntil: Tag;
  };
}

export function validateTags(taggedIssuerSigned: TaggedIssuerSigned): void {
  try {
    for (const [namespaceName, elements] of Object.entries(
      taggedIssuerSigned.nameSpaces,
    )) {
      for (const element of elements) {
        validateNamespacesTags(element, namespaceName);
      }
    }

    validateMobileSecurityObjectTags(taggedIssuerSigned.issuerAuth[2]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(
      `Failed to decode CBOR data - ${errorMessage}`,
      "CBOR_TAG_VALIDATION_ERROR",
    );
  }
}

function validateNamespacesTags(element: Tag, namespaceName: string): void {
  if (element.tag !== CBOR_TAGS.ENCODED_CBOR_DATA) {
    throw new MDLValidationError(
      `IssuerSignedItem in namespace '${namespaceName}' missing tag ${CBOR_TAGS.ENCODED_CBOR_DATA}`,
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

function validateMobileSecurityObjectTags(payload: Uint8Array) {
  const taggedMsoBytes: Tag = decode(payload);
  if (taggedMsoBytes.tag !== CBOR_TAGS.ENCODED_CBOR_DATA) {
    throw new MDLValidationError(
      `MobileSecurityObjectBytes missing tag ${CBOR_TAGS.ENCODED_CBOR_DATA}`,
      "MISSING_CBOR_TAG",
    );
  }
  const mso = decode(
    taggedMsoBytes.contents as Uint8Array,
  ) as TaggedMobileSecurityObject;

  const taggedValidityInfo = mso.validityInfo;

  if (
    taggedValidityInfo.signed &&
    taggedValidityInfo.signed.tag !== CBOR_TAGS.DATE_TIME
  ) {
    throw new MDLValidationError(
      `'signed' in 'ValidityInfo' missing tag ${CBOR_TAGS.DATE_TIME}`,
      "INVALID_DATE_TIME_TAG",
    );
  }

  if (
    taggedValidityInfo.validFrom &&
    taggedValidityInfo.validFrom.tag !== CBOR_TAGS.DATE_TIME
  ) {
    throw new MDLValidationError(
      `'validFrom' in 'ValidityInfo' missing tag ${CBOR_TAGS.DATE_TIME}`,
      "INVALID_DATE_TIME_TAG",
    );
  }

  if (
    taggedValidityInfo.validUntil &&
    taggedValidityInfo.validUntil.tag !== CBOR_TAGS.DATE_TIME
  ) {
    throw new MDLValidationError(
      `'validUntil' in 'ValidityInfo' missing tag ${CBOR_TAGS.DATE_TIME}`,
      "INVALID_DATE_TIME_TAG",
    );
  }
}
