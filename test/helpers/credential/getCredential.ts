import axios, { AxiosResponse } from "axios";

export async function getCredential(
  accessToken: string,
  proofJwt: string,
  endpoint: string,
): Promise<AxiosResponse> {
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
