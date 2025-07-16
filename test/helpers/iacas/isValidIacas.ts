import Ajv from "ajv";
import { iacasSchema } from "./iacasSchema";
import { X509Certificate } from "@peculiar/x509";
import { createHash } from "node:crypto";

export interface CertificateData {
  notAfter: string;
  notBefore: string;
  country: string;
  commonName: string;
}

export interface PublicKeyJwk {
  kty: string;
  crv: string;
  x: string;
  y: string;
}

export interface CertificateItem {
  id: string;
  active: boolean;
  certificatePem: string;
  certificateData: CertificateData;
  certificateFingerprint: string;
  publicKeyJwk: PublicKeyJwk;
}

export interface Iacas {
  data: CertificateItem[];
}

export async function isValidIacas(iacas: Iacas) {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  const rulesValidator = ajv.addSchema(iacasSchema).compile(iacasSchema);
  if (!rulesValidator(iacas)) {
    const errors = JSON.stringify(rulesValidator.errors);
    throw new Error(
      `INVALID_IACAS: IACAS does not comply with the schema. ${errors}`,
    );
  }

  const iaca = iacas.data[0];

  let certificate;
  let der;
  try {
    const pem = iaca.certificatePem;
    const pemBody = pem
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\s+/g, "");
    der = Buffer.from(pemBody, "base64");
    certificate = new X509Certificate(der);
  } catch (error) {
    throw new Error(
      `INVALID_IACAS: Certificate PEM could not be parsed as X509 certificate. ${JSON.stringify(error)}`,
    );
  }

  const certificateData = iaca.certificateData;
  if (certificateData.notBefore !== certificate.notBefore.toISOString()) {
    throw new Error(`INVALID_IACAS: notBefore does not match.`);
  }
  if (certificateData.notAfter !== certificate.notAfter.toISOString()) {
    throw new Error(`INVALID_IACAS: notAfter does not match.`);
  }
  if (certificateData.country !== certificate.subjectName.getField("C")[0]) {
    throw new Error(`INVALID_IACAS: country does not match.`);
  }
  if (
    certificateData.commonName !== certificate.subjectName.getField("CN")[0]
  ) {
    throw new Error(`INVALID_IACAS: commonName does not match.`);
  }

  const certificateFingerprint = iaca.certificateFingerprint;
  const fingerprint = createHash("sha256")
    .update(Buffer.from(der))
    .digest("hex");
  if (certificateFingerprint !== fingerprint) {
    throw new Error(`INVALID_IACAS: Fingerprint does not match.`);
  }

  const jwk = {
    kty: iaca.publicKeyJwk.kty,
    crv: iaca.publicKeyJwk.crv,
    x: iaca.publicKeyJwk.x,
    y: iaca.publicKeyJwk.y,
    key_ops: ["verify"],
  };
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: iaca.publicKeyJwk.crv,
    },
    false,
    ["verify"],
  );

  const isSelfSigned = await certificate.isSelfSigned();
  if (!isSelfSigned) {
    throw new Error(`INVALID_IACAS: Certificate is not self-signed`);
  }

  const isValidSignature = await certificate.verify({ publicKey: publicKey });
  if (!isValidSignature) {
    throw new Error(
      `INVALID_IACAS: Certificate signature could not be verified with IACA JWK`,
    );
  }

  return true;
}
