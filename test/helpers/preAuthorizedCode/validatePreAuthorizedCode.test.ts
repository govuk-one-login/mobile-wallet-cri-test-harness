import { validatePreAuthorizedCode } from "./validatePreAuthorizedCode";
console.log = jest.fn();

const jwks = [
  {
    kty: "EC",
    kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
    crv: "P-256",
    x: "7uUkwFnUzJGteTfUiHoG9xN0RdiN1ElvS0q2ToRU2kw",
    y: "DX4zp6nCqgYmiZTRcdwJvsxnHmHlb9I-xyezz8cf-LM",
  },
  {
    kty: "EC",
    kid: "44fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058266",
    crv: "P-256",
    x: "7uUkwFnUzJGteTfUiHoG9xN0RdiN1ElvS0q2ToRU2kw",
    y: "DX4zp6nCqgYmiZTRcdwJvsxnHmHlb9I-xyezz8cf-LM",
  },
];

describe("validatePreAuthorizedCode", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("should return 'true' when metadata is valid", async () => {
    const mockedDate = new Date(2024, 6, 17, 13, 16);
    jest.setSystemTime(mockedDate);
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";

    expect(await validatePreAuthorizedCode(preAuthCode, jwks)).toEqual(true);
  });

  it("should throw 'HEADER_DECODING_ERROR' error when token header cannot be decoded", async () => {
    const preAuthCode =
      "invalidHeader.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiYjMxYTA2ZTgtZmMwNi00YmE1LTkyNWItZWQ2N2NkZWEyNDgwIl0sImV4cCI6MTcyMTIyMTM4MywiaWF0IjoxNzIxMjIxMTQzfQ.IiVSp9p65Hfeh_GcLvJtJcz_LmjR5gAEkaIzVLKEWdt7-uXipFP9cr2d0eTL37Y9zHUcqed4ojsuufpZsxFbEQ";

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "HEADER_DECODING_ERROR",
    );
  });

  it("should throw 'INVALID_HEADER' error when header is missing 'kid' claim", async () => {
    const preAuthCode =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNWE5N2JmNDktYTlkYy00Nzk0LTk5YjQtOWZjYWU0ZDExNDQ4Il0sImV4cCI6MTcyMTIyMjAyOCwiaWF0IjoxNzIxMjIxNzg4fQ.Hd1_-zO5vU_09Hj0TRiCRIoLU-xMS-yPxEJCsnp4HZW5U3JET98-FO8IFuN3GOhpwks9ChAI8vSUSsHyVJm6zA";

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "INVALID_HEADER",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Pre-authorized code header does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"kid"},"message":"must have required property \'kid\'"}]',
    );
  });

  it("should throw 'JWK_NOT_IN_DID' error when 'kid' claim does not match JWK 'kid'", async () => {
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";
    const jwks = [
      {
        kty: "EC",
        kid: "different-key-id",
        crv: "P-256",
        x: "7uUkwFnUzJGteTfUiHoG9xN0RdiN1ElvS0q2ToRU2kw",
        y: "DX4zp6nCqgYmiZTRcdwJvsxnHmHlb9I-xyezz8cf-LM",
      },
    ];

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "JWK_NOT_IN_DID",
    );
  });

  it("should throw 'INVALID_SIGNATURE' when signature cannot be verified", async () => {
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";
    const jwks = [
      {
        kty: "EC",
        kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
        crv: "P-256",
        x: "oU5Xs7sFXCckKMKGAiRMhv1q7RWqlYTl80Voqi1kZow",
        y: "mXADd0XOLEtq8mk2mP0qhdDnS0hIUjQJZ4fJ1Df3Cvo",
      },
    ];

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "INVALID_SIGNATURE",
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when payload is missing 'iss' claim", async () => {
    const mockedDate = new Date(2024, 5, 17, 13, 16);
    jest.setSystemTime(mockedDate);
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiY3JlZGVudGlhbF9pZGVudGlmaWVycyI6WyI5YzBkMjYzNy04NmJjLTQ1Y2UtOTllZS0yOGU0ODkxZDYzN2IiXSwiZXhwIjoxNzIxMjIyNTY2LCJpYXQiOjE3MjEyMjIzMjZ9.KMybgMtmrqkM3AfZ-spDudIvDe3O4XGgyxEqC_F4tVQiIbm7qL9mp9L_3AqYA-1tJvuDELmlWDkPLgp3D0pysg";

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "INVALID_PAYLOAD",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Pre-authorized code payload does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"iss"},"message":"must have required property \'iss\'"}]',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when 'iat' claim is in the future", async () => {
    const mockedDate = new Date(2024, 5, 17, 13, 16);
    jest.setSystemTime(mockedDate);
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "INVALID_PAYLOAD",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "iat" value in token. Should be in the past but is in the future',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when token expiry is not 5 minutes", async () => {
    const mockedDate = new Date(2024, 6, 17, 14, 0);
    jest.setSystemTime(mockedDate);
    const preAuthCode =
      "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiYjMxYTA2ZTgtZmMwNi00YmE1LTkyNWItZWQ2N2NkZWEyNDgwIl0sImV4cCI6MTcyMTIyMTM4MywiaWF0IjoxNzIxMjIxMTQzfQ.IiVSp9p65Hfeh_GcLvJtJcz_LmjR5gAEkaIzVLKEWdt7-uXipFP9cr2d0eTL37Y9zHUcqed4ojsuufpZsxFbEQ";

    await expect(validatePreAuthorizedCode(preAuthCode, jwks)).rejects.toThrow(
      "INVALID_PAYLOAD",
    );
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "exp" value in token. Should be 5 minutes seconds but found 4',
    );
  });
});
