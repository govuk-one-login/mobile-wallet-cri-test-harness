import axios, { AxiosResponse } from "axios";
import { getDockerDnsName } from "../../src/config";

async function getWellKnown(
  criUrl: string,
  path: string,
  errorLabel: string,
): Promise<AxiosResponse> {
  try {
    const url = new URL(path, criUrl).toString();
    return await axios.get(getDockerDnsName(url));
  } catch (error) {
    console.log(
      `Error trying to fetch ${errorLabel}: ${JSON.stringify(error)}`,
    );
    throw new Error(`GET_${errorLabel.toUpperCase()}_ERROR`);
  }
}

export async function getJwks(criUrl: string): Promise<AxiosResponse> {
  return getWellKnown(criUrl, ".well-known/jwks.json", "jwks");
}

export async function getMetadata(criUrl: string): Promise<AxiosResponse> {
  return getWellKnown(
    criUrl,
    ".well-known/openid-credential-issuer",
    "metadata",
  );
}

export async function getDidDocument(criUrl: string): Promise<AxiosResponse> {
  return getWellKnown(criUrl, ".well-known/did.json", "did_document");
}

export async function getCredential(
  accessToken: string,
  proofJwt: string,
  credentialUrl: string,
): Promise<AxiosResponse> {
  return await axios.post(
    getDockerDnsName(credentialUrl),
    {
      proof: {
        proof_type: "jwt",
        jwt: proofJwt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function sendNotification(
  accessToken: string | undefined,
  notification_id: string | undefined,
  event: string,
  notificationUrl: string,
): Promise<AxiosResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  return await axios.post(
    getDockerDnsName(notificationUrl),
    {
      notification_id,
      event,
    },
    { headers },
  );
}
