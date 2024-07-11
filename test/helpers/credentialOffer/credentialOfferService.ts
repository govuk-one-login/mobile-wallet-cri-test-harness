import Ajv from "ajv";
import addFormats from "ajv-formats";
import { credentialOfferSchema } from "./credentialOfferSchema";

interface CredentialOffer {
  credential_issuer: string;
  credentials: string[];
  grants: Grants;
}

interface Grants {
  "urn:ietf:params:oauth:grant-type:pre-authorized_code": PreAuthorizedCode;
}

interface PreAuthorizedCode {
  "pre-authorized_code": string;
}

export class CredentialOfferService {
  static #instance: CredentialOfferService;
  private _preAuthorizedCode: string | undefined = undefined;

  private constructor() {}

  public static get instance(): CredentialOfferService {
    if (!CredentialOfferService.#instance) {
      CredentialOfferService.#instance = new CredentialOfferService();
    }
    return CredentialOfferService.#instance;
  }

  get preAuthorizedCode(): string | undefined {
    return this._preAuthorizedCode;
  }

  validate(credentialOfferDeepLink: string) {
    const parsedDeepLink = this.parseAsUrl(credentialOfferDeepLink);

    const credentialOfferRaw =
      parsedDeepLink.searchParams.get("credential_offer");
    if (credentialOfferRaw == null) {
      throw new Error("MISSING_CREDENTIAL_OFFER");
    }
    const credentialOffer: CredentialOffer =
      this.parseAsJson(credentialOfferRaw);

    const ajv = new Ajv({ allErrors: true, verbose: false });
    addFormats(ajv, { formats: ["uri"] });

    const rulesValidator = ajv
      .addSchema(credentialOfferSchema)
      .compile(credentialOfferSchema);

    const isValidPayload = rulesValidator(credentialOffer);
    if (!isValidPayload) {
      console.log(
        `Credential offer does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
      );
      throw new Error("INVALID_CREDENTIAL_OFFER");
    }

    console.log("Credential offer complies with the schema");
    this._preAuthorizedCode =
      credentialOffer.grants[
        "urn:ietf:params:oauth:grant-type:pre-authorized_code"
      ]["pre-authorized_code"];
    return true;
  }

  parseAsUrl(urlString: string) {
    try {
      return new URL(urlString);
    } catch (error) {
      console.log(`Failed to parse as URL: ${error}`);
      throw new Error("INVALID_DEEP_LINK");
    }
  }

  parseAsJson(inputString: string) {
    try {
      return JSON.parse(inputString);
    } catch (error) {
      console.log(`Failed to parse as JSON: ${error}`);
      throw new Error("INVALID_JSON");
    }
  }
}
