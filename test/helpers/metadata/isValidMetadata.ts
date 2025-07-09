import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metadataSchema } from "./metadataSchema";
import { CredentialFormat } from "../enums/credentialFormat";

export interface Metadata {
  credential_endpoint: string;
  notification_endpoint?: string;
  mdoc_iacas_uri?: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export async function isValidMetadata(
  metadata: Metadata,
  criUrl: string,
  authServerUrl: string,
  credentialFormat: string,
): Promise<true> {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri"] });
  const rulesValidator = ajv.addSchema(metadataSchema).compile(metadataSchema);
  if (!rulesValidator(metadata)) {
    const validationErrors = rulesValidator.errors;
    throw new Error(
      `INVALID_METADATA: Metadata does not comply with the schema. ${JSON.stringify(validationErrors)}`,
    );
  }

  if (!metadata.authorization_servers.includes(authServerUrl)) {
    throw new Error(
      `INVALID_METADATA: Invalid "authorization_servers" value. Should contain ${authServerUrl} but only contains ${metadata.authorization_servers}`,
    );
  }

  if (metadata.credential_issuer !== criUrl) {
    throw new Error(
      `INVALID_METADATA: Invalid "credential_issuer" value. Should be ${criUrl} but found ${metadata.credential_issuer}`,
    );
  }

  const validCredentialEndpoint = criUrl + "/credential";
  if (metadata.credential_endpoint !== validCredentialEndpoint) {
    throw new Error(
      `INVALID_METADATA: Invalid "credential_endpoint" value. Should be ${validCredentialEndpoint} but found ${metadata.credential_endpoint}`,
    );
  }

  const validNotificationEndpoint = criUrl + "/notification";
  if (
    metadata.notification_endpoint &&
    metadata.notification_endpoint !== validNotificationEndpoint
  ) {
    throw new Error(
      `INVALID_METADATA: Invalid "notification_endpoint" value. Should be ${validNotificationEndpoint} but found ${metadata.notification_endpoint}`,
    );
  }

  if (credentialFormat === CredentialFormat.MDOC) {
    // mdoc_iacas_uri is required in mDoc credentials only
    const validIacasEndpoint = criUrl + "/iacas";
    if (
      !metadata.mdoc_iacas_uri ||
      metadata.mdoc_iacas_uri !== validIacasEndpoint
    ) {
      throw new Error(
        `INVALID_METADATA: Invalid "mdoc_iacas_uri" value. Should be ${validIacasEndpoint} but found ${metadata.mdoc_iacas_uri}`,
      );
    }
  }

  return true;
}
