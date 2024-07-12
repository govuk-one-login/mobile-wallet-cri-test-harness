import { CredentialOfferService } from "./credentialOfferService";

console.log = jest.fn();

describe("credentialOfferService", () => {
  let credentialOfferService: CredentialOfferService;
  beforeEach(() => {
    credentialOfferService = new CredentialOfferService();
  });

  it("should return 'true' when credential offer document is valid", async () => {
    const credentialOffer =
      "https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D";
    expect(credentialOfferService.validate(credentialOffer)).toEqual(true);
    expect(credentialOfferService.preAuthorizedCode).toEqual(
      "eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug",
    );
  });

  it("should throw 'INVALID_DEEP_LINK' error if deep link is not a valid URL", async () => {
    const credentialOffer =
      "mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D";
    expect(() => credentialOfferService.validate(credentialOffer)).toThrow(
      "INVALID_DEEP_LINK",
    );
    expect(credentialOfferService.preAuthorizedCode).toEqual(undefined);
  });

  it("should throw 'MISSING_CREDENTIAL_OFFER' error if deep link does not contain a credential offer", async () => {
    const credentialOffer = "https://mobile.build.account.gov.uk/wallet-test/";
    expect(() => credentialOfferService.validate(credentialOffer)).toThrow(
      "MISSING_CREDENTIAL_OFFER",
    );
    expect(credentialOfferService.preAuthorizedCode).toEqual(undefined);
  });

  it("should throw 'INVALID_JSON' error if credential offer is not a valid JSON", async () => {
    const credentialOffer =
      "https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%";
    expect(() => credentialOfferService.validate(credentialOffer)).toThrow(
      "INVALID_JSON",
    );
    expect(credentialOfferService.preAuthorizedCode).toEqual(undefined);
  });

  it("should throw 'INVALID_CREDENTIAL_OFFER' if credential offer is missing required parameter 'grants'", async () => {
    const credentialOffer =
      "https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22missingGrants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D";
    expect(() => credentialOfferService.validate(credentialOffer)).toThrow(
      "INVALID_CREDENTIAL_OFFER",
    );
    expect(credentialOfferService.preAuthorizedCode).toEqual(undefined);
    expect(console.log).toHaveBeenCalledWith(
      'Payload does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"grants"},"message":"must have required property \'grants\'"},{"instancePath":"","schemaPath":"#/additionalProperties","keyword":"additionalProperties","params":{"additionalProperty":"missingGrants"},"message":"must NOT have additional properties"}]',
    );
  });
});
