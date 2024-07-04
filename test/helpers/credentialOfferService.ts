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
    let parsedUrl;
    try {
      parsedUrl = new URL(credentialOfferDeepLink);
    } catch (error) {
      console.log(error);
      return "INVALID_DEEP_LINK";
    }

    let credentialOfferParsed;
    try {
      const credentialOfferRaw = parsedUrl.searchParams.get("credential_offer");
      if (credentialOfferRaw == null) {
        return "INVALID_CREDENTIAL_OFFER";
      }
      credentialOfferParsed = JSON.parse(credentialOfferRaw);
    } catch (error) {
      console.log(error);
      return "INVALID_CREDENTIAL_OFFER";
    }

    const credentialIssuer = credentialOfferParsed["credential_issuer"];
    if (!credentialIssuer) {
      return "MISSING_CREDENTIAL_ISSUER";
    }
    try {
      new URL(credentialIssuer);
    } catch (error) {
      console.log(error);
      return "INVALID_CREDENTIAL_ISSUER";
    }

    const credentials = credentialOfferParsed["credentials"];
    if (!credentials) {
      return "MISSING_CREDENTIALS";
    }
    if (
      !Array.isArray(credentials) ||
      credentials.length < 1 ||
      !credentials[0]
    ) {
      return "INVALID_CREDENTIALS";
    }

    const grants = credentialOfferParsed["grants"];
    if (!grants) {
      return "MISSING_GRANTS";
    }

    const grantType =
      grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
    if (!grants) {
      return "MISSING_GRANT_TYPE";
    }

    const preAuthorizedCode = grantType["pre-authorized_code"];
    if (!preAuthorizedCode) {
      return "MISSING_PRE-AUTHORIZED_CODE";
    }

    this._preAuthorizedCode = preAuthorizedCode;
    return true;
  }
}
