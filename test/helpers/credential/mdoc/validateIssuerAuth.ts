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
  ValidityInfo,
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
  rootCertificatePem: string,
) {
  const protectedHeader = issuerAuth[0];
  validateProtectedHeader(protectedHeader);

  const unprotectedHeader = issuerAuth[1];
  const certificate = await validateUnprotectedHeader(
    unprotectedHeader,
    rootCertificatePem,
  );

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

async function validateUnprotectedHeader(
  unprotectedHeader: Map<number, Uint8Array | Uint8Array[]>,
  rootCertificatePem: string,
): Promise<X509Certificate> {
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
  const certificateBytes = Array.isArray(x5chain) ? x5chain[0] : x5chain;

  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(certificateBytes);
  } catch (error) {
    throw new MDLValidationError(
      `Failed to parse document signing certificate as X509Certificate - ${errorMessage(error)}`,
      "INVALID_UNPROTECTED_HEADER",
    );
  }

  const rootCertificate = new X509Certificate(rootCertificatePem);
  try {
    const outcome = certificate.verify(rootCertificate.publicKey);
    if (!outcome) {
      throw new MDLValidationError(
        "Document signing certificate signature not verified",
        "INVALID_UNPROTECTED_HEADER",
      );
    }
  } catch (error) {
    if (error instanceof MDLValidationError) {
      throw error;
    }
    throw new MDLValidationError(
      `Signature could not be verified - ${errorMessage(error)} `,
      "INVALID_UNPROTECTED_HEADER",
    );
  }

  return certificate;
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

  validateValidityInfo(mobileSecurityObject.validityInfo);
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

function validateDigests(
  valueDigests: ValueDigests,
  nameSpaces: Record<NameSpace, Tag[]>,
): void {
  for (const [namespace, items] of Object.entries(nameSpaces) as [
    NameSpace,
    Tag[],
  ][]) {
    for (const taggedIssuerSignedItemBytes of items) {
      const encodedTaggedIssuerSignedItemBytes = encode(
        taggedIssuerSignedItemBytes,
      );
      const calculatedDigest = createHash("sha256")
        .update(encodedTaggedIssuerSignedItemBytes)
        .digest();

      const issuerSignedItemBytes =
        taggedIssuerSignedItemBytes.contents as Uint8Array;
      const issuedSignedItem = decode(
        issuerSignedItemBytes,
      ) as TaggedIssuerSignedItem;
      const digestID = issuedSignedItem.digestID;

      const msoDigests = valueDigests[namespace] as Map<number, Uint8Array>;
      const expectedDigest = msoDigests.get(digestID);
      if (!expectedDigest) {
        throw new MDLValidationError(
          `No digest found for digestID ${digestID} in MSO namespace ${namespace}: ${[...msoDigests.keys()]}`,
        );
      }
      if (!calculatedDigest.equals(expectedDigest)) {
        throw new MDLValidationError(
          `Digest mismatch for element identifier "${issuedSignedItem.elementIdentifier} with digest ID ${digestID} in namespace ${namespace} - Expected ${Buffer.from(expectedDigest).toString("hex")} but calculated ${calculatedDigest.toString("hex")}`,
          "INVALID_DIGESTS",
        );
      }
    }
  }
}

async function validateDeviceKey(
  deviceKey: Map<unknown, unknown>,
): Promise<void> {
  const requiredKeys = [1, -1, -2, -3];
  const keys = new Set(deviceKey.keys());

  if (
    keys.size !== requiredKeys.length ||
    requiredKeys.some((k) => !keys.has(k))
  ) {
    throw new MDLValidationError(
      "DeviceKey must contain exactly the keys [1, -1, -2, -3]",
      "INVALID_DEVICE_KEY",
    );
  }

  if (deviceKey.get(1) !== 2) {
    throw new MDLValidationError(
      "DeviceKey key type (1) must be EC2 (Elliptic Curve) (2)",
      "INVALID_DEVICE_KEY",
    );
  }

  if (deviceKey.get(-1) !== 1) {
    throw new MDLValidationError(
      "DeviceKey curve (-1) must be P-256 (1)",
      "INVALID_DEVICE_KEY",
    );
  }

  if (!(deviceKey.get(-2) instanceof Uint8Array)) {
    throw new MDLValidationError(
      "DeviceKey x-coordinate (-2) must be a Uint8Array",
      "INVALID_DEVICE_KEY",
    );
  }
  if (!(deviceKey.get(-3) instanceof Uint8Array)) {
    throw new MDLValidationError(
      "DeviceKey y-coordinate (-3) must be a Uint8Array",
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

function verifySignature(
  publicKey: KeyObject,
  protectedHeader: Uint8Array,
  payload: Uint8Array,
  signature: Uint8Array,
): void {
  const sigStructure = createSigStructure(protectedHeader, payload);

  try {
    const outcome = verify("sha256", sigStructure, publicKey, signature);
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

function validateValidityInfo(validityInfo: ValidityInfo): void {
  const errors: string[] = [];
  const now = new Date();

  const { signed, validFrom, validUntil } = validityInfo;

  const signedDate = new Date(signed);
  const validFromDate = new Date(validFrom);
  const validUntilDate = new Date(validUntil);

  if (signedDate > now) errors.push(`'signed' (${signed}) must be in the past`);
  if (validFromDate > now)
    errors.push(`'validFrom' (${validFrom}) must be in the past`);
  if (validUntilDate <= now)
    errors.push(`'validUntil' (${validUntil}) must be in the future`);
  if (validFromDate < signedDate)
    errors.push(
      `'validFrom' (${validUntil}) must be equal or later than 'signed' (${signed})`,
    );

  if (errors.length !== 0) {
    throw new MDLValidationError(
      `One or more dates are invalid - ${errorMessage(errors)}`,
      "INVALID_VALIDITY_INFO",
    );
  }
}
