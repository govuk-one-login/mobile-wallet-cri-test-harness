import { validateCredential } from "./validateCredential";
import * as createProofJwtModule from "./createProofJwt";
import * as createAccessTokenModule from "./createAccessToken";
import axios, { AxiosResponse } from "axios";

jest.mock("axios");
jest.mock("./createProofJwt", () => ({
  createProofJwt: jest.fn(),
  createDidKey: jest.fn(),
}));
jest.mock("./createAccessToken", () => ({
  createAccessToken: jest.fn(),
}));
console.log = jest.fn();

describe("validateCredential", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const createProofJwt = createProofJwtModule.createProofJwt as jest.Mock;
  const createAccessToken =
    createAccessTokenModule.createAccessToken as jest.Mock;
  const createDidKey = createProofJwtModule.createDidKey as jest.Mock;

  const walletSubjectId = "wallet_subject_id";
  const preAuthorizedCode =
    "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw";
  const credentialsEndpoint = "http://example-cri.test.gov.uk/credential";
  const didJwks = [
    {
      kty: "EC",
      kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
      crv: "P-256",
      x: "rbtj1EEBv4ANT3ZwAM5IMisZkpWYmigXYWmzm8mS6og",
      y: "RyFJYZ3l_zLJ2w4OFcW8DKCf9ohne9KNqlJGySwW4Ro",
    },
  ];
  const privateKeyJwk = {
    kty: "EC",
    x: "MMDgSI-XZWGzTCuPXwJerzvcvn93CJTe8ARsb0oLZw8",
    y: "VexEnyluTVBOrT_0ZOmNTl2ab9CXFTvb4BDIB93Mv7g",
    crv: "P-256",
    d: "K7DmYFhkGoXdwBROSL2mZvcNxONlhBQj5kV7yevigtk",
  };
  const publicKeyJwk = {
    kty: "EC",
    x: "UFgGaSQ8drsCJ9PsvYHMRfVQjo82iCQ2RIkfe1eWzTg",
    y: "k9AO7P3HmojHqSWM5ALd_XRGlAjHIDx_o5edrr9Wdz8",
    crv: "P-256",
  };

  it("should return 'true' when credential is valid", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    expect(
      await validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).toEqual(true);
  });

  it("should throw 'INVALID_STATUS_CODE' error when response status code is not 200", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 201,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_STATUS_CODE");
  });

  it("should throw 'INVALID_RESPONSE_DATA' error when response body is falsy", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_RESPONSE_DATA");
  });

  it("should throw 'HEADER_DECODING_ERROR' error when token header cannot be decoded", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "invalidHeader.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("HEADER_DECODING_ERROR");
    expect(console.log).toHaveBeenCalledWith(
      "Error decoding header: TypeError: Invalid Token or Protected Header formatting",
    );
  });

  it("should throw 'INVALID_HEADER' error when header is missing 'kid' claim", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlaGVKV2ZTd1FodTIyWVB6ZHJYMjFFd0tYNHBTUWZLVW5ZM0RoTFZYZXltdVEiLCJuYmYiOjE3MjE3MzMxMzIsImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2OTEzMiwiaWF0IjoxNzIxNzMzMTMyLCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.5CMx5NbcU13FgjeHeqpyIu6K7F7P64JJ-UFBe8fnzbc3WfPbcAQ3L229-3SV0dee6uiMzC4wSMOdmqx37ULuNw",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_HEADER");
    expect(console.log).toHaveBeenCalledWith(
      'Credential header does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"kid"},"message":"must have required property \'kid\'"}]',
    );
  });

  it("should throw 'JWK_NOT_IN_DID' error when 'kid' claim does not match JWK 'kid'", async () => {
    const didJwks = [
      {
        kty: "EC",
        kid: "different-key-id",
        crv: "P-256",
        x: "7uUkwFnUzJGteTfUiHoG9xN0RdiN1ElvS0q2ToRU2kw",
        y: "DX4zp6nCqgYmiZTRcdwJvsxnHmHlb9I-xyezz8cf-LM",
      },
    ];
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("JWK_NOT_IN_DID");
  });

  it("should throw 'INVALID_SIGNATURE' when signature cannot be verified", async () => {
    const didJwks = [
      {
        kty: "EC",
        kid: "78fa131d677c1ac0f172c53b47ac169a95ad0d92c38bd794a70da59032058274",
        crv: "P-256",
        x: "oU5Xs7sFXCckKMKGAiRMhv1q7RWqlYTl80Voqi1kZow",
        y: "mXADd0XOLEtq8mk2mP0qhdDnS0hIUjQJZ4fJ1Df3Cvo",
      },
    ];
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_SIGNATURE");
    expect(console.log).toHaveBeenCalledWith(
      'Error verifying signature: {"code":"ERR_JWS_SIGNATURE_VERIFICATION_FAILED","name":"JWSSignatureVerificationFailed","message":"signature verification failed"}',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when payload is missing 'vc' claim", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlc2NSU3NNTHJCWnZucnNhTlljMnI1QUpjRDU4UmRTdzNiNFk4dXhId2NublQiLCJuYmYiOjE3MjE3MzMyMjQsImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2OTIyNCwiaWF0IjoxNzIxNzMzMjI0fQ.zdGelDvTt1tpEx7_6E2GTjnoxXRGez0jH67UHwNW7mVKpZax_wxZyB0stPDr4yy-AhBuX5hyNeu2w4ryxrBtgw",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Credential payload does not comply with the schema: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"vc"},"message":"must have required property \'vc\'"}]',
    );
  });

  it("should throw 'INVALID_PAYLOAD' error when payload is missing 'vc' claim", async () => {
    createProofJwt.mockReturnValueOnce(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVvNHV0OGl5dTFOVW16WU4xNmNtM2dXSHAzWVpXRzJDNnVFS2VGWmdFV1BlNyJ9.eyJub25jZSI6ImU0Y2VkY2Y2LTFmYjEtNDhmOC1iZjc0LTk0Y2ZiZTlkMGQ4NiIsImlhdCI6MTcyMTIxODU2MCwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6d2FsbGV0IiwiYXVkIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciJ9.9TR7FMtm_8s1apfFDcT_Jz72OQUFOB1jnbl3qyfNKeoKe0NBw1UNq3FdvuWkvRfxow_29V29I1tISCHpExF7HA",
    );
    createAccessToken.mockReturnValueOnce({
      access_token:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVkNzZiNDkyLWQ2MmUtNDZmNC1hM2Q5LWJjNTFlOGI5MWFjNSJ9.eyJjcmVkZW50aWFsX2lkZW50aWZpZXJzIjpbImUwYjAyNDM4LWQwMDYtNDEwMC05MThhLWIwMjYyOWUxZTI5YyJdLCJjX25vbmNlIjoiZTRjZWRjZjYtMWZiMS00OGY4LWJmNzQtOTRjZmJlOWQwZDg2Iiwic3ViIjoid2FsbGV0X3N1YmplY3RfaWQiLCJpc3MiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJhdWQiOiJ1cm46ZmRjOmdvdjp1azpleGFtcGxlLWNyZWRlbnRpYWwtaXNzdWVyIn0.n4YuxZdnHQgq1F6fWzcCB8nRYAO4CxQhGzLAxzhjBu3joBRTlJ3PQ8u2za0fLaZp99iGJITyxnyQXBZ9Q87L0w",
      token_type: "bearer",
      expires_in: 180,
    });
    createDidKey.mockReturnValueOnce(
      "did:key:zDnaeo4ut8iyu1NUmzYN16cm3gWHp3YZWG2C6uEKeFZgEWPe7",
    );
    const mockedResponse = {
      status: 200,
      data: {
        credential:
          "eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJkaWQ6a2V5OnpEbmFlY0FYYlcxWjNHcjhEOFcxWFh5c1Y0WFJXRE1aR1dQTEdpQ3VwSEJqZWhSNmMiLCJuYmYiOjE3MjE3MzExNjksImlzcyI6InVybjpmZGM6Z292OnVrOmV4YW1wbGUtY3JlZGVudGlhbC1pc3N1ZXIiLCJjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImV4cCI6MTc1MzI2NzE2OSwiaWF0IjoxNzIxNzMxMTY5LCJ2YyI6eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiU29jaWFsU2VjdXJpdHlDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOlt7Im5hbWVQYXJ0cyI6W3sidmFsdWUiOiJNciIsInR5cGUiOiJUaXRsZSJ9LHsidmFsdWUiOiJTYXJhaCIsInR5cGUiOiJHaXZlbk5hbWUifSx7InZhbHVlIjoiRWxpemFiZXRoIiwidHlwZSI6IkdpdmVuTmFtZSJ9LHsidmFsdWUiOiJFZHdhcmRzIiwidHlwZSI6IkZhbWlseU5hbWUifV19XSwic29jaWFsU2VjdXJpdHlSZWNvcmQiOlt7InBlcnNvbmFsTnVtYmVyIjoiUVExMjM0NTZDIn1dfX19.ZzpUN9TWIDmkyXakPU3WBS-6PUiKvNROLWXCa5WAInqDTwAbY4chfWGW94xY1hZLeEPA9pGvSwVeFgQSlvdIyA",
      },
    } as AxiosResponse;
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    await expect(
      validateCredential(
        preAuthorizedCode,
        walletSubjectId,
        credentialsEndpoint,
        didJwks,
        privateKeyJwk,
        publicKeyJwk,
      ),
    ).rejects.toThrow("INVALID_PAYLOAD");
    expect(console.log).toHaveBeenCalledWith(
      'Invalid "sub" value in token. Should be did:key:zDnaeo4ut8iyu1NUmzYN16cm3gWHp3YZWG2C6uEKeFZgEWPe7 but found did:key:zDnaecAXbW1Z3Gr8D8W1XXysV4XRWDMZGWPLGiCupHBjehR6c',
    );
  });
});
