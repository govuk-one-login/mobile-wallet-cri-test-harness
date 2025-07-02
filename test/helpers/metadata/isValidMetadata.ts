import axios, { AxiosResponse } from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metadataSchema } from "./metadataSchema";
import { getDockerDnsName } from "../../../src/config";

export interface Metadata {
  credential_endpoint: string;
  notification_endpoint?: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export async function isValidMetadata(
  metadata: Metadata,
  criUrl: string,
  authServerUrl: string,
): Promise<true> {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri"] });

  const rulesValidator = ajv.addSchema(metadataSchema).compile(metadataSchema);

  const isValidPayload = rulesValidator(metadata);
  if (!isValidPayload) {
    const validationErrors = rulesValidator.errors;
    throw new Error(
      `INVALID_METADATA: Metadata does not comply with the schema: ${JSON.stringify(validationErrors)}`,
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

  return true;
}

export async function getMetadata(criUrl): Promise<AxiosResponse> {
  const METADATA_PATH: string = ".well-known/openid-credential-issuer";
  try {
    const metadataUrl = new URL(METADATA_PATH, criUrl).toString();
    return await axios.get(getDockerDnsName(metadataUrl));
  } catch (error) {
    throw new Error(
      `GET_METADATA_ERROR: Error trying to fetch metadata: ${JSON.stringify(error)}`,
    );
  }
}
