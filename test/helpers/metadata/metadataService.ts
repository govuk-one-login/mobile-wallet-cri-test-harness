import axios, { AxiosResponse } from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {metadataSchema} from "./metadataSchema";

interface Metadata {
  credentials_endpoint: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export class MetadataService {
  static #instance: MetadataService;
  private METADATA_PATH: string = ".well-known/openid-credential-issuer";
  private _getCredentialsEndpoint!: string;
  private _getAuthorizationServersEndpoint!: string;

  private constructor() {}

  public static get instance(): MetadataService {
    if (!MetadataService.#instance) {
      MetadataService.#instance = new MetadataService();
    }
    return MetadataService.#instance;
  }

  get getCredentialsEndpoint(): string {
    return this._getCredentialsEndpoint;
  }

  get getAuthorizationServersEndpoint(): string {
    return this._getAuthorizationServersEndpoint;
  }

  async validate(criDomain: string) {
    const metadataResponse = await this.getMetadata(criDomain);

    if (metadataResponse.status !== 200) {
      throw new Error("INVALID_STATUS_CODE");
    }

    const metadata: Metadata = metadataResponse.data;
    if (!metadata) {
      throw new Error("INVALID_METADATA");
    }

    const ajv = new Ajv({ allErrors: true, verbose: false });
    addFormats(ajv, { formats: ["uri"] });

    const rulesValidator = ajv
        .addSchema(metadataSchema)
        .compile(metadataSchema);

    if (rulesValidator(metadata)) {
      console.log("Payload complies with the schema")
      this._getCredentialsEndpoint = metadata.credentials_endpoint;
      this._getAuthorizationServersEndpoint = metadata.authorization_servers[0];
      return true;
    }
    else {
      console.log(JSON.stringify(rulesValidator.errors))
      throw new Error("INVALID_METADATA")
    }
  }

  private async getMetadata(domain): Promise<AxiosResponse> {
    try {
      const metadataUrl = new URL(this.METADATA_PATH, domain).toString();
      return await axios.get(metadataUrl);
    } catch (error) {
      console.log(`Error fetching metadata: ${error}`);
      throw new Error("GET_METADATA_ERROR");
    }
  }
}
