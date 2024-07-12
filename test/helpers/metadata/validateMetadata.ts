import axios, { AxiosResponse } from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metadataSchema } from "./metadataSchema";

export interface Metadata {
  credentials_endpoint: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export async function validateMetadata(criDomain: string): Promise<true> {
  const metadataResponse = await getMetadata(criDomain);

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
  if (isValidPayload) {
    console.log("Metadata complies with the schema");
    return true;
  } else {
    const validationErrors = rulesValidator.errors;
    console.log(
      `Metadata does not comply with the schema: ${JSON.stringify(validationErrors)}`,
    );

    throw new Error("INVALID_METADATA");
  }
}

export async function getMetadata(domain): Promise<AxiosResponse> {
  const METADATA_PATH: string = ".well-known/openid-credential-issuer";

  try {
    const metadataUrl = new URL(METADATA_PATH, domain).toString();
    return await axios.get(metadataUrl);
  } catch (error) {
    console.log(`Error trying to fetch metadata: ${JSON.stringify(error)}`);
    throw new Error("GET_METADATA_ERROR");
  }
}
