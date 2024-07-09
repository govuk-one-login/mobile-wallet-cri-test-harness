import axios, { AxiosResponse } from "axios";
import { parseAsUrl } from "./parseAsUrl";

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

    const metadata = metadataResponse.data;
    if (!metadata) {
      throw new Error("INVALID_METADATA");
    }

    const credentialsEndpoint = metadata["credentials_endpoint"];
    if (!credentialsEndpoint) {
      throw new Error("INVALID_CREDENTIALS_ENDPOINT");
    }

    this._getCredentialsEndpoint = parseAsUrl(credentialsEndpoint).toString();

    const authorizationServers = metadata["authorization_servers"];
    if (
      !authorizationServers ||
      !Array.isArray(authorizationServers) ||
      authorizationServers.length < 1
    ) {
      throw new Error("INVALID_AUTHORIZATION_SERVERS");
    }
    this._getAuthorizationServersEndpoint = parseAsUrl(
      authorizationServers[0],
    ).toString();

    const credentialIssuer = metadata["credential_issuer"];
    if (!credentialIssuer) {
      throw new Error("INVALID_CREDENTIAL_ISSUER");
    }
    parseAsUrl(credentialIssuer);

    const credentialConfigurations =
      metadata["credential_configurations_supported"];
    if (
      !credentialConfigurations ||
      Object.keys(credentialConfigurations).length === 0
    ) {
      throw new Error("INVALID_CREDENTIAL_CONFIGURATIONS_SUPPORTED");
    }

    return true;
  }

  private async getMetadata(domain): Promise<AxiosResponse> {
    try {
      const metadataUrl = new URL(this.METADATA_PATH, domain).toString();
      return await axios.get(metadataUrl);
    } catch (error) {
      console.log(error);
      throw new Error("GET_METADATA_ERROR");
    }
  }
}
