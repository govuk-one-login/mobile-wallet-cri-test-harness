import axios, { AxiosResponse } from "axios";

export async function getCredential(
  accessToken: string,
  proofJwt: string,
  endpoint: string,
): Promise<AxiosResponse> {
  // When running the CRI and test harness locally, replace domain "localhost" with "host.docker.internal" before making the request
  endpoint = endpoint.replace("localhost", "host.docker.internal");
  const credentialUrl = new URL(endpoint).toString();

  return await axios.post(
    credentialUrl,
    {
      proof: {
        proof_type: "jwt",
        jwt: proofJwt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
