import { getCredentialFormat } from "../../src/config";

export type CredentialFormat = "jwt" | "mdoc";

/**
 * Credential format constants for conditional test execution.
 * Tests will only run if the current credential format matches the specified format.
 */
export const JWT_ONLY: CredentialFormat = "jwt";
export const MDOC_ONLY: CredentialFormat = "mdoc";

/**
 * Determines if a test should run based on the current credential format.
 * @param format - The credential format string to check against
 * @returns true if the current credential format matches the specified format
 */
const shouldRun = (format: CredentialFormat) =>
  getCredentialFormat() === format;

/**
 * Conditional version of Jest's describe() that only runs if the current
 * credential format matches the specified format.
 *
 * @param format - Credential format for which this test suite should run
 * @param name - Test suite name
 * @param fn - Test suite function
 */
export const conditionalDescribe = (
  format: CredentialFormat,
  name: string,
  fn: () => void,
) => {
  return shouldRun(format) ? describe(name, fn) : describe.skip(name, fn);
};

/**
 * Conditional version of Jest's it() that only runs if the current
 * credential format matches the specified format.
 *
 * @param format - Credential format for which this test should run
 * @param name - Test name
 * @param fn - Test function
 */
export const conditionalIt = (
  format: CredentialFormat,
  name: string,
  fn: () => void,
) => {
  return shouldRun(format) ? it(name, fn) : it.skip(name, fn);
};
