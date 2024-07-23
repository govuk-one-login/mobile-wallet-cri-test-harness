import Ajv from "ajv";
import addFormats from "ajv-formats";
import { credentialOfferSchema } from "./credentialOfferSchema";

export interface CredentialOffer {
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

export function validateCredentialOffer(credentialOfferDeepLink: string) {
  const credentialOfferString = getCredentialOffer(credentialOfferDeepLink);
  const credentialOffer: CredentialOffer = parseAsJson(credentialOfferString);

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

  return true;
}

export function parseAsJson(inputString: string) {
  try {
    return JSON.parse(inputString);
  } catch (error) {
    console.log(`Failed to parse as JSON: ${JSON.stringify(error)}`);
    throw new Error("INVALID_JSON");
  }
}

export function getCredentialOffer(urlString: string) {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (error) {
    console.log(`Failed to parse as URL: ${JSON.stringify(error)}`);
    throw new Error("INVALID_DEEP_LINK");
  }
  const credentialOffer = url.searchParams.get("credential_offer");
  if (credentialOffer == null) {
    throw new Error("MISSING_CREDENTIAL_OFFER");
  } else {
    return credentialOffer;
  }
}
