import { decode, encode, Tag } from "cbor2";
import {
  IssuerAuth,
  MDLValidationError,
  MobileSecurityObject,
  NameSpace,
  TaggedIssuerSignedItem,
  ValueDigests,
} from "./isValidCredential";
import { createHash, KeyObject, verify, X509Certificate } from "node:crypto";
import { getAjvInstance } from "../../ajv/ajvInstance";
import { mobileSecurityObjectSchema } from "./mobileSecurityObjectSchema";
import { CBOR_TAGS } from "./tags";

const TAGS = new Map([
  [
    CBOR_TAGS.ENCODED_CBOR_DATA,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ({ contents }: { contents: any }) => decode(contents, { tags: TAGS }),
  ],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [CBOR_TAGS.DATE_TIME, ({ contents }: { contents: any }) => contents],
]);

export async function validateIssuerAuth(
  issuerAuth: IssuerAuth,
  namespaces: Record<NameSpace, Tag[]>,
) {
  const protectedHeader = issuerAuth[0];
  validateProtectedHeader(protectedHeader);

  const unprotectedHeader = issuerAuth[1];
  const certificate = validateUnprotectedHeader(unprotectedHeader);

  const payload = issuerAuth[2];
  await validatePayload(payload, namespaces);

  verifySignature(
    certificate.publicKey,
    protectedHeader,
    payload,
    issuerAuth[3],
  );
}

function validateProtectedHeader(protectedHeader: Uint8Array): void {
  const protectedHeaderDecoded = decode(protectedHeader);

  if (!(protectedHeaderDecoded instanceof Map)) {
    throw new MDLValidationError(
      "Protected header is not a Map",
      "INVALID_PROTECTED_HEADER",
    );
  }
  if (protectedHeaderDecoded.size !== 1) {
    throw new MDLValidationError(
      "Protected header contains unexpected extra parameters",
      "INVALID_PROTECTED_HEADER",
    );
  }
  if (!protectedHeaderDecoded.has(1)) {
    throw new MDLValidationError(
      'Protected header missing "alg" (1)',
      "INVALID_PROTECTED_HEADER",
    );
  }
  if (protectedHeaderDecoded.get(1) !== -7) {
    throw new MDLValidationError(
      'Protected header "alg" must be -7 (ES256)',
      "INVALID_PROTECTED_HEADER",
    );
  }
}

function validateUnprotectedHeader(
  unprotectedHeader: Map<any, any>,
): X509Certificate {
  if (unprotectedHeader.size !== 1) {
    throw new MDLValidationError(
      "Unprotected header contains unexpected extra parameters",
      "INVALID_UNPROTECTED_HEADER",
    );
  }
  if (!unprotectedHeader.has(33)) {
    throw new MDLValidationError(
      'Unprotected header missing "x5chain" (33)',
      "INVALID_UNPROTECTED_HEADER",
    );
  }

  const x5chain = unprotectedHeader.get(33);
  if (x5chain instanceof Uint8Array || Buffer.isBuffer(x5chain)) {
    try {
      return new X509Certificate(x5chain);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new MDLValidationError(
        `Failed to parse X509Certificate - ${errorMessage}`,
        "INVALID_UNPROTECTED_HEADER",
      );
    }
  }

  if (Array.isArray(x5chain)) {
    // TODO: Extracting the first certificate for now but this logic can be updated to extract all
    const certificate = x5chain[0];
    if (!(certificate instanceof Uint8Array) && !Buffer.isBuffer(certificate)) {
      throw new MDLValidationError(
        "Certificate in x5chain array is not a byte string",
        "INVALID_UNPROTECTED_HEADER",
      );
    }

    try {
      return new X509Certificate(certificate);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new MDLValidationError(
        `Failed to parse X509Certificate in array - ${errorMessage}`,
        "INVALID_UNPROTECTED_HEADER",
      );
    }
  }

  throw new MDLValidationError(
    'The "x5chain" field must be a byte string or an array of byte strings',
    "INVALID_UNPROTECTED_HEADER",
  );
}

async function validatePayload(
  payload: Uint8Array,
  nameSpaces: Record<NameSpace, Tag[]>,
) {
  const mobileSecurityObject: MobileSecurityObject = decode(payload, {
    tags: TAGS,
  });
  console.log(mobileSecurityObject);
  validateMobileSecurityObject(mobileSecurityObject);

  await validateDeviceKey(mobileSecurityObject.deviceKeyInfo.deviceKey);

  validateDigests(mobileSecurityObject.valueDigests, nameSpaces);
}

function validateMobileSecurityObject(
  mobileSecurityObject: MobileSecurityObject,
): void {
  const ajv = getAjvInstance();

  const validator = ajv.compile(mobileSecurityObjectSchema);

  if (!validator(mobileSecurityObject)) {
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
      `MobileSecurityObject does not comply with schema - ${errorDetails}`,
      "SCHEMA_VALIDATION_ERROR",
    );
  }
}

async function validateDeviceKey(deviceKey: Map<any, any>): Promise<void> {
  if (deviceKey.size !== 4) {
    throw new MDLValidationError(
      "deviceKey contains unexpected extra parameters",
      "INVALID_DEVICE_KEY",
    );
  }

  const requiredKeys = [1, -1, -2, -3];
  for (const key of requiredKeys) {
    if (!deviceKey.has(key)) {
      throw new MDLValidationError(
        `deviceKey missing required key ${key}`,
        "INVALID_DEVICE_KEY",
      );
    }
  }

  if (deviceKey.get(1) !== 2) {
    throw new MDLValidationError(
      "deviceKey key type (1) must be EC2 (Elliptic Curve) (2)",
      "INVALID_DEVICE_KEY",
    );
  }

  if (deviceKey.get(-1) !== 1) {
    throw new MDLValidationError(
      "deviceKey curve (-1) must be P-256 (1)",
      "INVALID_DEVICE_KEY",
    );
  }

  if (!(deviceKey.get(-2) instanceof Uint8Array)) {
    throw new MDLValidationError(
      "deviceKey x-coordinate (-2) must be a Uint8Array",
      "INVALID_DEVICE_KEY",
    );
  }
  if (!(deviceKey.get(-3) instanceof Uint8Array)) {
    throw new MDLValidationError(
      "deviceKey y-coordinate (-3) must be a Uint8Array",
      "INVALID_DEVICE_KEY",
    );
  }

  try {
    const jwk = {
      kty: "EC",
      crv: "P-256",
      x: Buffer.from(deviceKey.get(-2)).toString("base64url"),
      y: Buffer.from(deviceKey.get(-3)).toString("base64url"),
    };

    await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
  } catch {
    throw new MDLValidationError(
      `Invalid elliptic curve key`,
      "INVALID_DEVICE_KEY",
    );
  }
}

function validateDigests(
  valueDigests: ValueDigests,
  nameSpaces: Record<NameSpace, Tag[]>,
): void {
  for (const [namespace, items] of Object.entries(nameSpaces) as [
    NameSpace,
    Tag[],
  ][]) {
    const expectedDigests = valueDigests[namespace] as Map<unknown, Uint8Array>;
    if (!areAllKeysAreIntegers(expectedDigests)) {
      throw new MDLValidationError(
        "Digest IDs must be integers",
        "INVALID_DIGESTS",
      );
    }

    for (const taggedIssuerSignedItemBytes of items) {
      const encodedIssuerSignedItemBytes = encode(taggedIssuerSignedItemBytes);
      const calculatedDigest = createHash("sha256")
        .update(encodedIssuerSignedItemBytes)
        .digest();
      const issuerSignedItemBytes =
        taggedIssuerSignedItemBytes.contents as Uint8Array;
      const decodedItem = decode(
        issuerSignedItemBytes,
      ) as TaggedIssuerSignedItem;
      const digestID = decodedItem.digestID;

      const expectedDigest = expectedDigests.get(digestID);
      if (!expectedDigest) {
        throw new MDLValidationError(
          `No expected digest found for digestID "${digestID}" in namespace "${namespace}"`,
          "INVALID_DIGESTS",
        );
      }

      if (!calculatedDigest.equals(expectedDigest)) {
        throw new MDLValidationError(
          `Digest mismatch for "${decodedItem.elementIdentifier}" (digestID: ${digestID}) in namespace "${namespace}"\n` +
            `Expected: ${Buffer.from(expectedDigest).toString("hex")}\n` +
            `Calculated: ${calculatedDigest.toString("hex")}`,
          "INVALID_DIGESTS",
        );
      }
    }
  }
}

function areAllKeysAreIntegers(map: Map<any, any>): boolean {
  return Array.from(map.keys()).every((key) => Number.isInteger(key));
}

function verifySignature(
  publicKey: KeyObject,
  protectedHeader: Uint8Array,
  payload: Uint8Array,
  signature: Uint8Array,
): boolean {
  const sigStructure = createSigStructure(protectedHeader, payload);

  try {
    return verify("sha256", sigStructure, publicKey, signature);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MDLValidationError(`A - ${errorMessage}`, "INVALID_SIGNATURE");
  }
}

function createSigStructure(
  protectedHeader: Uint8Array,
  payload: Uint8Array,
): Uint8Array {
  const sigStructure = [
    "Signature1",
    protectedHeader,
    new Uint8Array(),
    payload,
  ];

  return encode(sigStructure);
}
