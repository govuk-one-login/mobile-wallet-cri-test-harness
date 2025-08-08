import { getAjvInstance } from "../../ajv/ajvInstance";
import cbor from "cbor";
import { domesticNamespaceSchema } from "./domesticNamespaceSchema";
import { issuerSignedSchema } from "./issuedSignedSchema";
import { isoNamespaceSchema } from "./isoNamespaceSchema";
import { CBOR_TAGS } from "./cborTags";

const MDL_NAMESPACES = {
  GB: "org.iso.18013.5.1.GB",
  ISO: "org.iso.18013.5.1",
} as const;

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

export async function isValidCredential(
  issuerSigned: string,
): Promise<boolean> {
  // Decode CBOR data
  const decodedData = decodeIssuerSigned(issuerSigned);
  console.log("Decoded mDL data:", JSON.stringify(decodedData));

  // Validate against JSON schemas
  await validateIssuerSigned(decodedData);

  // Verify required elements are present
  validateRequiredElements(decodedData);

  return true;
}

/**
 * Decodes CBOR data while preserving tag information and handling nested decoding.
 * This function handles CBOR tag 24 (encoded CBOR data item) by recursively
 * decoding nested CBOR structures.
 */
function decodeIssuerSigned(issuerSigned: string) {
  try {
    const buffer = Buffer.from(issuerSigned, "hex");
    const options = {
      mapAsObject: false,
      tags: {
        // Handle CBOR tag 24 (encoded CBOR data item)
        [CBOR_TAGS.ENCODED_CBOR]: (val: Buffer) => {
          // Recursively decode the nested CBOR data
          const nestedDecoded = cbor.decodeFirstSync(val);

          return {
            tag: CBOR_TAGS.ENCODED_CBOR,
            value: nestedDecoded,
          };
        },
      },
    };
    return cbor.decodeFirstSync(buffer, options);
  } catch (error) {
    throw new Error(
      `INVALID_MDL: Failed to decode CBOR data - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function validateIssuerSigned(decodedData): Promise<void> {
  const ajv = getAjvInstance();
  const rulesValidator = ajv
    .addSchema(isoNamespaceSchema)
    .addSchema(domesticNamespaceSchema)
    .compile(issuerSignedSchema);
  if (!rulesValidator(decodedData)) {
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

function validateRequiredElements(decodedData): void {
  const allItems = [
    ...decodedData.nameSpaces[MDL_NAMESPACES.GB],
    ...decodedData.nameSpaces[MDL_NAMESPACES.ISO],
  ];

  const presentElements = allItems.map((item) => item.value.elementIdentifier);
  const missingElements = REQUIRED_ELEMENTS.filter(
    (el) => !presentElements.includes(el),
  );

  if (missingElements.length > 0) {
    throw new Error(
      `INVALID_MDL: Missing required elements - ${missingElements.join(", ")}`,
    );
  }
}
