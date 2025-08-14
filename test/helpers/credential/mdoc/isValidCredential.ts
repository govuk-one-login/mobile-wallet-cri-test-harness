import { getAjvInstance } from "../../ajv/ajvInstance";
import { decode, Tag } from "cbor2";
import { domesticNamespaceSchema } from "./domesticNamespaceSchema";
import { issuerSignedSchema } from "./issuedSignedSchema";
import { isoNamespaceSchema } from "./isoNamespaceSchema";

const REQUIRED_ELEMENTS = [
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

export interface IssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, IssuerSignedItem[]>;
}

export type NameSpace = "org.iso.18013.5.1" | "org.iso.18013.5.1.GB";

type IssuerAuth = [Uint8Array, Map<33, Uint8Array>, Uint8Array, Uint8Array];

export interface DrivingPrivileges {
  vehicleCategoryCode: string;
  issueDate: Tag;
  expiryDate: Tag;
}

export interface IssuerSignedItemWithTags {
  digestId: number;
  elementIdentifier: string;
  elementValue: string | boolean | DrivingPrivileges[] | Uint8Array | Tag;
  random: Uint8Array;
}

export interface IssuerSignedItem {
  digestId: number;
  elementIdentifier: string;
  elementValue: string | boolean | DrivingPrivileges[] | Uint8Array;
  random: Uint8Array;
}

function decodeCredential(credential: string): IssuerSigned {
  const tags = new Map([
    [
      24,
      ({ contents }) => {
        return decode(contents, { tags });
      },
    ],
    [1004, ({ contents }) => contents],
  ]);

  return decode(credential, { tags });
}

export function isValidCredential(credential: string): boolean {
  const issuerSigned = decodeCredential(credential);

  validateTags(credential);

  validateIssuerSigned(issuerSigned);

  validateRequiredElements(issuerSigned);

  return true;
}

function validateTags(credential: string): void {
  try {
    const issuerSigned: {
      issuerAuth: IssuerAuth;
      nameSpaces: Record<NameSpace, Tag[]>;
    } = decode(credential);

    for (const elements of Object.values(issuerSigned.nameSpaces)) {
      for (const element of elements) {
        if (element.tag !== 24) {
          throw new Error(
            "One or more IssuerSignedItem objects are not CBOR encoded - missing CBOR tag 24 is missing",
          );
        }

        const decodedIssuerSignedItem = decode(
          element.contents as string,
        ) as IssuerSignedItemWithTags;

        if (
          decodedIssuerSignedItem.elementIdentifier === "birth_date" ||
          decodedIssuerSignedItem.elementIdentifier === "issue_date" ||
          decodedIssuerSignedItem.elementIdentifier === "expiry_date"
        ) {
          if (
            !(decodedIssuerSignedItem.elementValue instanceof Tag) ||
            decodedIssuerSignedItem.elementValue.tag !== 1004
          ) {
            throw new Error("Date not tagged (CBOR tag 1004)");
          }
        }

        if (
          decodedIssuerSignedItem.elementIdentifier === "driving_privileges" ||
          decodedIssuerSignedItem.elementIdentifier ===
            "provisional_driving_privileges"
        ) {
          const privileges =
            decodedIssuerSignedItem.elementValue as DrivingPrivileges[];

          for (const item of privileges) {
            if (item.issueDate) {
              const tag = item.issueDate.tag;
              if (!tag || tag !== 1004) {
                throw new Error(
                  `Date not tagged (CBOR tag 1004) for issueDate in ${decodedIssuerSignedItem.elementIdentifier}`,
                );
              }
            }

            if (item.expiryDate) {
              const tag = item.expiryDate.tag;
              if (!tag || tag !== 1004) {
                throw new Error(
                  `Date not tagged (CBOR tag 1004) for expiryDate in ${decodedIssuerSignedItem.elementIdentifier}`,
                );
              }
            }
          }
        }
      }
    }
  } catch (error) {
    throw new Error(
      `INVALID_MDL: Failed to decode CBOR data - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function validateIssuerSigned(issuerSigned: IssuerSigned): void {
  const ajv = getAjvInstance();
  const rulesValidator = ajv
    .addSchema(isoNamespaceSchema)
    .addSchema(domesticNamespaceSchema)
    .compile(issuerSignedSchema);
  if (!rulesValidator(issuerSigned)) {
    const errors = rulesValidator.errors!.map((error) => ({
      path: error.instancePath,
      message: error.message,
      value: error.data,
    }));

    throw new Error(
      `INVALID_MDL: IssuerSigned does not comply with the schema. ${JSON.stringify(errors)}`,
    );
  }
}

function validateRequiredElements(issuerSigned: IssuerSigned): void {
  const allItems = [
    ...issuerSigned.nameSpaces["org.iso.18013.5.1"],
    ...issuerSigned.nameSpaces["org.iso.18013.5.1.GB"],
  ];

  const presentElements = allItems.map((item) => item.elementIdentifier);
  const missingElements = REQUIRED_ELEMENTS.filter(
    (el) => !presentElements.includes(el),
  );

  if (missingElements.length > 0) {
    throw new Error(
      `INVALID_MDL: Missing required elements - ${missingElements.join(", ")}`,
    );
  }
}
