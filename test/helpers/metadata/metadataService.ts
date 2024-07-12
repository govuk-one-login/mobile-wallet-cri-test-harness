import axios, { AxiosResponse } from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metadataSchema } from "./metadataSchema";

interface Metadata {
  credentials_endpoint: string;
  authorization_servers: string[];
  credential_issuer: string;
  credential_configurations_supported: object;
}

export class MetadataService {
  static #instance: MetadataService;
  private METADATA_PATH: string = ".well-known/openid-credential-issuer";
  private _credentialsEndpoint: string | undefined = undefined;
  private _authorizationServersEndpoint: string | undefined = undefined;

  public constructor() {}

  public static get instance(): MetadataService {
    if (!MetadataService.#instance) {
      MetadataService.#instance = new MetadataService();
    }
    return MetadataService.#instance;
  }

  get credentialsEndpoint(): string | undefined {
    return this._credentialsEndpoint;
  }

  get authorizationServersEndpoint(): string | undefined {
    return this._authorizationServersEndpoint;
  }

  async validate(criDomain: string) {
    const metadataResponse = await this.getMetadata(criDomain);

    if (metadataResponse.status !== 200) {
      throw new Error("INVALID_STATUS_CODE");
    }

    const metadata: Metadata = metadataResponse.data;
    if (!metadata) {
      throw new Error("INVALID_RESPONSE_DATA");
    }

    const ajv = new Ajv({ allErrors: true, verbose: false });
    addFormats(ajv, { formats: ["uri"] });

    const rulesValidator = ajv
      .addSchema(metadataSchema)
      .compile(metadataSchema);

    const isValidPayload = rulesValidator(metadata);
    if (isValidPayload) {
      console.log("Payload complies with the schema");
      this.setCredentialsEndpoint(metadata);
      this.setAuthorizationServersEndpoint(metadata);
      return true;
    } else {
      const validationErrors = rulesValidator.errors;
      console.log(
        `Payload does not comply with the schema: ${JSON.stringify(validationErrors)}`,
      );

      const validationErrorsInstancePaths = validationErrors!.map(
        (item) => item.instancePath,
      );

      const validationErrorsParams = validationErrors!.map(
        (item) => item.message,
      );

      if (
        !this.containsCredentialsEndpointErrors(
          validationErrorsInstancePaths,
          validationErrorsParams,
        )
      ) {
        this.setCredentialsEndpoint(metadata);
      }

      if (
        !this.containsAuthorizationServersErrors(
          validationErrorsInstancePaths,
          validationErrorsParams,
        )
      ) {
        this.setAuthorizationServersEndpoint(metadata);
      }

      throw new Error("INVALID_METADATA");
    }
  }

  private containsAuthorizationServersErrors(
    validationErrorsInstancePaths: string[],
    validationErrorsParams: (string | undefined)[],
  ) {
    return (
      validationErrorsInstancePaths.includes("/authorization_servers") ||
      validationErrorsParams.find((value) =>
        value?.includes("authorization_servers"),
      )
    );
  }

  private containsCredentialsEndpointErrors(
    validationErrorsInstancePaths: string[],
    validationErrorsParams: (string | undefined)[],
  ) {
    return (
      validationErrorsInstancePaths.includes("/credentials_endpoint") ||
      validationErrorsParams.find((value) =>
        value?.includes("credentials_endpoint"),
      )
    );
  }

  private setAuthorizationServersEndpoint(metadata: Metadata) {
    this._authorizationServersEndpoint = metadata.authorization_servers[0];
  }

  private setCredentialsEndpoint(metadata: Metadata) {
    this._credentialsEndpoint = metadata.credentials_endpoint;
  }

  private async getMetadata(domain): Promise<AxiosResponse> {
    try {
      const metadataUrl = new URL(this.METADATA_PATH, domain).toString();
      return await axios.get(metadataUrl);
    } catch (error) {
      console.log(`Error trying to fetch metadata: ${error}`);
      throw new Error("GET_METADATA_ERROR");
    }
  }
}
