/**
 * Configuration module for environment variables and application settings
 */

const ENV_VARS = {
  PORT: "PORT",
  CREDENTIAL_OFFER_DEEP_LINK: "CREDENTIAL_OFFER_DEEP_LINK",
  CRI_DOMAIN: "CRI_DOMAIN",
  WALLET_SUBJECT_ID: "WALLET_SUBJECT_ID",
  TEST_HARNESS_URL: "TEST_HARNESS_URL",
  CLIENT_ID: "CLIENT_ID",
} as const;

/**
 * Gets an environment variable value
 * @param variableName - Name of the environment variable
 * @returns The environment variable value
 * @throws Error if the environment variable is not set
 */
function getEnvVarValue(variableName: string): string {
  const variableValue = process.env[variableName];
  if (!variableValue) {
    throw new Error(`${variableName} environment variable not set`);
  }
  return variableValue;
}

export function getPortNumber(): number {
  return parseInt(getEnvVarValue(ENV_VARS.PORT), 10);
}

export function getCredentialOfferDeepLink(): string {
  return getEnvVarValue(ENV_VARS.CREDENTIAL_OFFER_DEEP_LINK);
}

export function getCriDomain(): string {
  return getEnvVarValue(ENV_VARS.CRI_DOMAIN);
}

export function getWalletSubjectId(): string {
  return getEnvVarValue(ENV_VARS.WALLET_SUBJECT_ID);
}

export function getKeyId(): string {
  return "5d76b492-d62e-46f4-a3d9-bc51e8b91ac5";
}

export function getCriUrl(): string {
  const criDomain = getCriDomain();
  const protocol = criDomain.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${criDomain}`;
}

export function getSelfURL(): string {
  try {
    return getEnvVarValue(ENV_VARS.TEST_HARNESS_URL);
  } catch {
    console.log("TEST_HARNESS_URL not set, using localhost fallback");
    return `http://localhost:${getPortNumber()}`;
  }
}

export function getClientId(): string {
  return getEnvVarValue(ENV_VARS.CLIENT_ID);
}
