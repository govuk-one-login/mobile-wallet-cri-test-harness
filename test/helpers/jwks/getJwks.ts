import axios, { AxiosResponse } from "axios";
import { getDockerDnsName } from "../../../src/config";


export async function getJwks(criUrl): Promise<AxiosResponse> {
  const JWKS_PATH: string = ".well-known/jwks.json";
  try {
    const jwksUrl = new URL(JWKS_PATH, criUrl).toString();
    return await axios.get(getDockerDnsName(jwksUrl));
  } catch (error) {
    console.log(`Error trying to fetch jwks: ${JSON.stringify(error)}`);
    throw new Error("GET_JWKS_ERROR");
  }
}

