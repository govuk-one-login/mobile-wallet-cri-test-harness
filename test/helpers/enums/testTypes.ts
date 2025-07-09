import { CredentialFormat } from "./credentialFormat";

export const TestTypes = {
  JWT_ONLY: [CredentialFormat.JWT],
  MDOC_ONLY: [CredentialFormat.MDOC],
  JWT_AND_MDOC: [CredentialFormat.JWT, CredentialFormat.MDOC],
} as const;
