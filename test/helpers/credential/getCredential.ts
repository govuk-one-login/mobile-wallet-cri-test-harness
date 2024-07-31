import axios, { AxiosResponse } from "axios";
import {getDockerDnsName} from "../../../src/config";

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
      },
    },
  );
}
