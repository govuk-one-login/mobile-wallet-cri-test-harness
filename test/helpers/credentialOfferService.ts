import { parseAsUrl } from "./parseAsUrl";

export class CredentialOfferService {
  static #instance: CredentialOfferService;
  private _preAuthorizedCode!: string;

  private constructor() {}

  public static get instance(): CredentialOfferService {
    if (!CredentialOfferService.#instance) {
      CredentialOfferService.#instance = new CredentialOfferService();
    }
    return CredentialOfferService.#instance;
  }

  get preAuthorizedCode(): string {
    return this._preAuthorizedCode;
  }

  validate(credentialOfferDeepLink: string) {
    const parsedDeepLink = parseAsUrl(credentialOfferDeepLink);

    const credentialOfferRaw =
      parsedDeepLink.searchParams.get("credential_offer");
    if (credentialOfferRaw == null) {
      throw new Error("INVALID_CREDENTIAL_OFFER");
    }
    const credentialOffer = this.parseAsJson(credentialOfferRaw);
    const credentialIssuer = credentialOffer["credential_issuer"];
    if (!credentialIssuer) {
      throw new Error("INVALID_CREDENTIAL_ISSUER");
    }
    parseAsUrl(credentialIssuer);

    const credentials = credentialOffer["credentials"];
    if (
      !credentials ||
      !Array.isArray(credentials) ||
      credentials.length < 1 ||
      !credentials[0]
    ) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const grants = credentialOffer["grants"];
    if (!grants) {
      throw new Error("INVALID_GRANTS");
    }

    const grantType =
      grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
    if (!grants) {
      throw new Error("INVALID_GRANT_TYPE");
    }

    const preAuthorizedCode = grantType["pre-authorized_code"];
    if (!preAuthorizedCode) {
      throw new Error("INVALID_PREAUTHORIZED_CODE");
    }

    this._preAuthorizedCode = preAuthorizedCode;
    return true;
  }

  parseAsJson(inputString: string) {
    try {
      return JSON.parse(inputString);
    } catch (error) {
      console.log(error);
      throw new Error("INVALID_JSON");
    }
  }
}
