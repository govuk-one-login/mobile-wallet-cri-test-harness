import {
  getCriDomain,
  getCriUrl,
  getCredentialOfferDeepLink,
  getWalletSubjectId,
} from "../src/config";
import {
  CredentialOffer,
  getCredentialOffer,
  parseAsJson,
  validateCredentialOffer,
} from "./helpers/credentialOffer/validateCredentialOffer";
import {
  getMetadata,
  Metadata,
  validateMetadata,
} from "./helpers/metadata/validateMetadata";
import {
  DidDocument,
  getDidDocument,
  validateDidDocument,
} from "./helpers/didDocument/validateDidDocument";
import { validatePreAuthorizedCode } from "./helpers/preAuthorizedCode/validatePreAuthorizedCode";
import { readFileSync } from "fs";
import { JWK } from "jose";
import { createAccessToken } from "./helpers/sts/createAccessToken";

describe("credential-issuer-tests", () => {
  const credentialOfferDeepLink = getCredentialOfferDeepLink();
  const criUrl = getCriUrl();
  const criDomain = getCriDomain();
  const walletSubjectId = getWalletSubjectId();

  it("should validate the credential offer", async () => {
    const outcome = validateCredentialOffer(credentialOfferDeepLink);
    expect(outcome).toEqual(true);
  });

  it("should validate the credential metadata", async () => {
    expect(await validateMetadata(criUrl)).toEqual(true);
  });

  it("should validate the DID document", async () => {
    expect(await validateDidDocument(criUrl, criDomain)).toEqual(true);
  });

  it("should validate the pre-authorized code", async () => {
    const preAuthorizedCode = getPreAuthorizedCode(credentialOfferDeepLink);
    const didDocument: DidDocument = (await getDidDocument(criUrl)).data;
    const publicKeyJwks = didDocument.verificationMethod.map(
      (verificationMethod) => verificationMethod.publicKeyJwk,
    );

    expect(
      await validatePreAuthorizedCode(preAuthorizedCode, publicKeyJwks),
    ).toEqual(true);
  });

  it("should generate an access token", async () => {
    const preAuthorizedCode = getPreAuthorizedCode(credentialOfferDeepLink);
    const privateKey = JSON.parse(
      readFileSync("test/helpers/sts/privateKey", "utf8"),
    ) as JWK;
    const accessToken = await createAccessToken(
      walletSubjectId,
      preAuthorizedCode,
      privateKey,
    );
    console.log(`Access token: ${accessToken.access_token}`);

    expect(accessToken).toBeTruthy();
  });

  it("should be future test that needs the metadata", async () => {
    const metadata: Metadata = (await getMetadata(criUrl)).data;
    expect(metadata).toBeTruthy();
  });
});

function getPreAuthorizedCode(credentialOfferDeepLink: string) {
  const credentialOffer = getCredentialOffer(credentialOfferDeepLink);
  const preAuthorizedCode = (parseAsJson(credentialOffer!) as CredentialOffer)
    .grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
    "pre-authorized_code"
  ];
  return preAuthorizedCode;
}
