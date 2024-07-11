function getEnvVarValue(variableName: string): string {
  const variableValue = process.env[variableName];
  if (!variableValue) {
    throw new Error(`${variableName} environment variable not set`);
  }
  return variableValue;
}
export function getPortNumber(): string {
  return getEnvVarValue("PORT");
}

export function getCredentialOffer(): string {
  return getEnvVarValue("CREDENTIAL_OFFER_DEEP_LINK");
}

export function getCriDomain(): string {
  return getEnvVarValue("CRI_DOMAIN");
}

export function getCriUrl(): string {
  const criDomain = getCriDomain();
  if (
    criDomain.startsWith("host.docker.internal") ||
    criDomain.startsWith("localhost")
  ) {
    return "http://" + criDomain;
  } else {
    return "https://" + criDomain;
  }
}
