import { importJWK, SignJWT } from "jose";

process.env.CRI_DOMAIN = "localhost:8080";
import { validatePreAuthorizedCode } from "./validatePreAuthorizedCode";
console.log = jest.fn();

const jwks = [
  {
    kty: "EC",
    kid: "66fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058086",
    crv: "P-256",
    x: "7uUkwFnUzJGteTfUiHoG9xN0RdiN1ElvS0q2ToRU2kw",
    y: "DX4zp6nCqgYmiZTRcdwJvsxnHmHlb9I-xyezz8cf-LM",
  },
  {
    kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
    kty: "EC",
    x: "-OxU7o3ZtHJ7GnufJkGKv3EAgeisXdZg1eTKErzsiL8",
    y: "1yKvdIgdktb6MYaVU2Ptt_yrnU1Y5gmT2uJbc9q4vGg",
    crv: "P-256",
  },
];

const clientId = "TEST_CLIENT_ID";
const authServerUrl = "https://test-auth-server.gov.uk";
const criUrl = "https://test-example-cri.gov.uk";
const kid = "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274";

describe("validatePreAuthorizedCode", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-08-01T09:08:24.000Z"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 'true' when pre-authorized code is valid", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      kid,
    );
    expect(
      await validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).toEqual(true);
  });

  it("should throw 'HEADER_DECODING_ERROR' error when token header cannot be decoded", async () => {
    const preAuthorizedCode =
      "invalidHeader" +
      (await getTestJwt(authServerUrl, criUrl, clientId, kid));
    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("HEADER_DECODING_ERROR");
  });

  it("should throw 'INVALID_HEADER' error when header is missing 'kid' claim", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      undefined,
    );
    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_HEADER");
    expect(console.log).toHaveBeenCalledWith(
      'Pre-authorized code header does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"kid"},"message":"must have required property \'kid\'"}]',
    );
  });

  it("should throw 'JWK_NOT_IN_DID' error when 'kid' claim does not match JWK 'kid'", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      "not-the-same-kid",
    );
    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("JWK_NOT_IN_DID");
  });

  it("should throw 'INVALID_SIGNATURE' when signature cannot be verified", async () => {
    const jwks = [
      {
        kty: "EC",
        kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
        crv: "P-256",
        x: "oU5Xs7sFXCckKMKGAiRMhv1q7RWqlYTl80Voqi1kZow",
        y: "mXADd0XOLEtq8mk2mP0qhdDnS0hIUjQJZ4fJ1Df3Cvo",
      },
    ];
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      kid,
    );
    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_SIGNATURE");
  });

  it("should throw 'INVALID_PAYLOAD' error when payload is missing 'iss' claim", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      undefined,
      clientId,
      kid,
    );
    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Pre-authorized code payload does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"iss"},"message":"must have required property \'iss\'"}]',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when 'iat' claim is in the future", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      kid,
    );
    jest.useFakeTimers().setSystemTime(new Date("2024-08-01T07:08:24.000Z"));

    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "iat" value in token. Should be in the past but is in the future',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when token expiry is not 5 minutes", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      clientId,
      kid,
      "10minutes",
    );

    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "exp" value in token. Should be "5 minutes" seconds but found "10 minutes"',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when token issuer is not 'https://test-example-cri.gov.uk'", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      "https://different-issuer.gov.uk",
      clientId,
      kid,
    );

    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "iss" value in token. Should be "https://test-example-cri.gov.uk" but found "https://different-issuer.gov.uk"',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when token audience is not 'https://test-auth-server.gov.uk'", async () => {
    const preAuthorizedCode = await getTestJwt(
      "https://different-audience.gov.uk",
      criUrl,
      clientId,
      kid,
    );

    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "aud" value in token. Should be "https://test-auth-server.gov.uk" but found "https://different-audience.gov.uk"',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when token clientId is not 'TEST_CLIENT_ID", async () => {
    const preAuthorizedCode = await getTestJwt(
      authServerUrl,
      criUrl,
      "invalid-client-id",
      kid,
    );

    await expect(
      validatePreAuthorizedCode(
        preAuthorizedCode,
        jwks,
        criUrl,
        authServerUrl,
        clientId,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "clientId" value in token. Should be "TEST_CLIENT_ID" but found "invalid-client-id"',
    );
  });
});

async function getTestJwt(audience, issuer, clientId, kid, exp = "5minutes") {
  const privateKey = {
    kty: "EC",
    x: "-OxU7o3ZtHJ7GnufJkGKv3EAgeisXdZg1eTKErzsiL8",
    y: "1yKvdIgdktb6MYaVU2Ptt_yrnU1Y5gmT2uJbc9q4vGg",
    crv: "P-256",
    d: "uhF3qwj2ddRwnWO84tCS-qJEsm7m__bAG5x6klw-rng",
  };

  const signingKeyAsKeyLike = await importJWK(privateKey, "ES256");

  return await new SignJWT({
    clientId: clientId,
    credential_identifiers: ["727da4d1-0636-4951-81eb-801c1cf90dd3"],
  })
    .setProtectedHeader({ alg: "ES256", typ: "JWT", kid: kid })
    .setIssuedAt()
    .setExpirationTime(exp)
    .setIssuer(issuer)
    .setAudience(audience)
    .sign(signingKeyAsKeyLike);
}
