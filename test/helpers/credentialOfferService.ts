import Ajv from "ajv";
import addFormats from "ajv-formats"

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
    const parsedDeepLink = this.parseAsUrl(credentialOfferDeepLink);

    const credentialOfferRaw =
      parsedDeepLink.searchParams.get("credential_offer");
    if (credentialOfferRaw == null) {
      throw new Error("MISSING_CREDENTIAL_OFFER");
    }
    const credentialOffer: CredentialOffer = this.parseAsJson(credentialOfferRaw);

    const ajv = new Ajv({ allErrors: true, verbose: true});
    addFormats(ajv, { formats: ['uri'] });

    const schema = {
      type: "object",
      properties: {
        credential_issuer: {
          "type": "string",
          "format": "uri"
        },
        credentials: {type: "array", items: {type: "string"}, minItems: 1 },
        grants: {
          type: "object",
          properties: {
            "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
              type: "object",
              properties: {
                "pre-authorized_code": {type: "string"},
              },
              additionalProperties: false,
              required: ["pre-authorized_code"],
            },
          },
          additionalProperties: false,
          required: ["urn:ietf:params:oauth:grant-type:pre-authorized_code"],
        }
      },
      additionalProperties: false,
      required: ["credential_issuer", "credentials", "grants"]
    }


    const rulesValidator = ajv.addSchema(schema).compile(schema);
    if (rulesValidator(credentialOffer)) {
      console.log("Payload complies with the schema")
      this._preAuthorizedCode = credentialOffer.grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]["pre-authorized_code"];
      return true;
    }
    else {
      console.log(JSON.stringify(rulesValidator.errors))
      throw new Error("INVALID_CREDENTIAL_OFFER")
    }
  }

  parseAsUrl(urlString: string) {
    try {
      return new URL(urlString);
    } catch (error) {
      console.log(error);
      throw new Error("INVALID_URL");
    }
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
