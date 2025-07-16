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
    const message = JSON.stringify(rulesValidator.errors);
    throw new Error(
      `INVALID_IACAS: IACAS does not comply with the schema. ${message}`,
    );
  }

  const pem = iacas.data[0].certificatePem;
  const pemBody = pem
    .replace("-----BEGIN CERTIFICATE-----", "")
    .replace("-----END CERTIFICATE-----", "")
    .replace(/\s+/g, "");
  const der = Buffer.from(pemBody, "base64");
  const cert = new X509Certificate(der);

  const notBefore = cert.notBefore.toISOString();
  const notAfter = cert.notAfter.toISOString();

  console.log(cert.subjectName.getThumbprint("sha256"));
  console.log(cert.subjectName);

  const fingerprint = createHash("sha256")
    .update(Buffer.from(der))
    .digest("hex");
  const publicKeyJwk = cert.publicKey;

  console.log({
    notBefore,
    notAfter,
    certificateFingerprint: fingerprint,
    publicKeyJwk,
  });

  return true;
}
