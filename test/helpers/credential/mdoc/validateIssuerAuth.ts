import { decode, encode, Tag } from "cbor2";

import { createHash, KeyObject, verify, X509Certificate } from "node:crypto";
import { getAjvInstance } from "../../ajv/ajvInstance";
import { mobileSecurityObjectSchema } from "./schemas/mobileSecurityObjectSchema";
import { TAGS } from "./constants/tags";
import { errorMessage, MDLValidationError } from "./MDLValidationError";
import { IssuerAuth, TaggedIssuerSignedItem } from "./types/issuerSigned";
import { NameSpace } from "./types/namespaces";
import {
  MobileSecurityObject,
  ValueDigests,
} from "./types/mobileSecurityObject";

const tags = new Map([
  [
    TAGS.ENCODED_CBOR_DATA,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ({ contents }: { contents: any }) => decode(contents, { tags: tags }),
  ],
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [TAGS.DATE_TIME, ({ contents }: { contents: any }) => contents],
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

  try {
    const outcome = verifySignature(
      certificate.publicKey,
      protectedHeader,
      payload,
      issuerAuth[3],
    );
    if (!outcome) {
      throw new MDLValidationError(
        "Signature not verified",
        "INVALID_SIGNATURE",
      );
    }
  } catch (error) {
    if (error instanceof MDLValidationError) {
      throw error;
    }
    throw new MDLValidationError(
      `Signature could not be verified - ${errorMessage(error)} `,
      "INVALID_SIGNATURE",
    );
  }
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
      "Protected header contains unexpected extra parameters - must contain only one",
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
  unprotectedHeader: Map<number, Uint8Array | Uint8Array[]>,
): X509Certificate {
  if (unprotectedHeader.size !== 1) {
    throw new MDLValidationError(
      "Unprotected header contains unexpected extra parameters - must contain only one",
      "INVALID_UNPROTECTED_HEADER",
    );
  }
  if (!unprotectedHeader.has(33)) {
    throw new MDLValidationError(
      'Unprotected header missing "x5chain" (33)',
      "INVALID_UNPROTECTED_HEADER",
    );
  }

  const x5chain = unprotectedHeader.get(33)!;
  const certificate = Array.isArray(x5chain) ? x5chain[0] : x5chain;

  try {
    return new X509Certificate(certificate);
  } catch (error) {
    throw new MDLValidationError(
      `Failed to parse as X509Certificate - ${errorMessage(error)}`,
      "INVALID_UNPROTECTED_HEADER",
    );
  }
}

async function validatePayload(
  payload: Uint8Array,
  nameSpaces: Record<NameSpace, Tag[]>,
) {
  const mobileSecurityObject: MobileSecurityObject = decode(payload, {
    tags: tags,
  });
  validateMobileSecurityObject(mobileSecurityObject);

  validateDigests(mobileSecurityObject.valueDigests, nameSpaces);

  await validateDeviceKey(mobileSecurityObject.deviceKeyInfo.deviceKey);
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
      "INVALID_SCHEMA",
    );
  }
}

async function validateDeviceKey(
  deviceKey: Map<unknown, unknown>,
): Promise<void> {
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
      x: Buffer.from(deviceKey.get(-2) as Uint8Array).toString("base64url"),
      y: Buffer.from(deviceKey.get(-3) as Uint8Array).toString("base64url"),
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
    const expectedDigests = valueDigests[namespace] as Map<number, Uint8Array>;
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

function verifySignature(
  publicKey: KeyObject,
  protectedHeader: Uint8Array,
  payload: Uint8Array,
  signature: Uint8Array,
): boolean {
  const sigStructure = createSigStructure(protectedHeader, payload);

  return verify("sha256", sigStructure, publicKey, signature);
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
