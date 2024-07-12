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

function parseAsUrl(urlString: string) {
  try {
    return new URL(urlString);
  } catch (error) {
    console.log(`Failed to parse as URL: ${error}`);
    throw new Error("INVALID_DEEP_LINK");
  }
}

function parseAsJson(inputString: string) {
  try {
    return JSON.parse(inputString);
  } catch (error) {
    console.log(`Failed to parse as JSON: ${error}`);
    throw new Error("INVALID_JSON");
  }
}

export function validateCredentialOffer(credentialOfferDeepLink: string) {
  const parsedDeepLink = parseAsUrl(credentialOfferDeepLink);

  const credentialOfferRaw =
    parsedDeepLink.searchParams.get("credential_offer");
  if (credentialOfferRaw == null) {
    throw new Error("MISSING_CREDENTIAL_OFFER");
  }
  const credentialOffer: CredentialOffer = parseAsJson(credentialOfferRaw);

  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv, { formats: ["uri"] });

  const rulesValidator = ajv
    .addSchema(credentialOfferSchema)
    .compile(credentialOfferSchema);

  const isValidPayload = rulesValidator(credentialOffer);
  if (!isValidPayload) {
    console.log(
      `Payload does not comply with the schema: ${JSON.stringify(rulesValidator.errors)}`,
    );
    throw new Error("INVALID_CREDENTIAL_OFFER");
  }

  console.log("Payload complies with the schema");
  return true;
}
