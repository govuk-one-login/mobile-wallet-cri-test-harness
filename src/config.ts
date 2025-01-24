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

export function getCredentialOfferDeepLink(): string {
  return getEnvVarValue("CREDENTIAL_OFFER_DEEP_LINK");
}

export function getCriDomain(): string {
  return getEnvVarValue("CRI_DOMAIN");
}

export function getWalletSubjectId(): string {
  return getEnvVarValue("WALLET_SUBJECT_ID");
}

export function getKeyId(): string {
  return "5d76b492-d62e-46f4-a3d9-bc51e8b91ac5";
}

export function getCriUrl(): string {
  const criDomain = getCriDomain();
  if (criDomain.startsWith("localhost")) {
    return "http://" + criDomain;
  } else {
    return "https://" + criDomain;
  }
}

export function getSelfURL(): string {
  try {
    return getEnvVarValue("TEST_HARNESS_URL");
  } catch (error) {
    console.log(`Returning local TEST_HARNESS_URL value`);
    return `http://localhost:${getPortNumber()}`;
  }
}

export function getClientId(): string {
  return getEnvVarValue("CLIENT_ID");
}

// When running locally, "localhost" must be replaced with "host.docker.internal" when making a request
export function getDockerDnsName(url) {
  if (url.startsWith("http://localhost")) {
    return url.replace("localhost", "host.docker.internal");
  } else {
    return url;
  }
}
