import axios, { AxiosResponse } from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metadataSchema } from "./metadataSchema";
import { getDockerDnsName } from "../../../src/config";

export interface Metadata {
  credential_endpoint: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export async function validateMetadata(
  criUrl: string,
  authServerUrl: string,
): Promise<true> {
  const metadataResponse = await getMetadata(criUrl);

  if (metadataResponse.status !== 200) {
    throw new Error("INVALID_STATUS_CODE");
  }

  const metadata: Metadata = metadataResponse.data;
  if (!metadata) {
    throw new Error("INVALID_RESPONSE_DATA");
  }

  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri"] });

  const rulesValidator = ajv.addSchema(metadataSchema).compile(metadataSchema);

  const isValidPayload = rulesValidator(metadata);
  if (!isValidPayload) {
    const validationErrors = rulesValidator.errors;
    console.log(
      `Metadata does not comply with the schema: ${JSON.stringify(validationErrors)}`,
    );
    throw new Error("INVALID_METADATA");
  }

  if (!metadata.authorization_servers.includes(authServerUrl)) {
    console.log(
      `Invalid "authorization_servers" value. Should contain ${authServerUrl} but only contains ${metadata.authorization_servers}`,
    );
    throw new Error("INVALID_METADATA");
  }

  if (metadata.credential_issuer !== criUrl) {
    console.log(
      `Invalid "credential_issuer" value. Should be ${criUrl} but found ${metadata.credential_issuer}`,
    );
    throw new Error("INVALID_METADATA");
  }

  if (metadata.credential_endpoint !== criUrl + "/credential") {
    console.log(
      `Invalid "credential_endpoint" value. Should be ${criUrl + "/credential"} but found ${metadata.credential_endpoint}`,
    );
    throw new Error("INVALID_METADATA");
  }

  return true;
}

export async function getMetadata(criUrl): Promise<AxiosResponse> {
  const METADATA_PATH: string = ".well-known/openid-credential-issuer";

  try {
    const metadataUrl = new URL(METADATA_PATH, criUrl).toString();
    return await axios.get(getDockerDnsName(metadataUrl));
  } catch (error) {
    console.log(`Error trying to fetch metadata: ${JSON.stringify(error)}`);
    throw new Error("GET_METADATA_ERROR");
  }
}
