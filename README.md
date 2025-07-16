# Wallet Credential Issuer Test Harness

## Overview

This test harness enables GOV.UK Wallet credential issuer services to validate their implementations without requiring access to the mobile app. It acts as a mock wallet client that can test credential issuance flows end-to-end.

## How It Works

**1. Start the Test Harness**
- Use the appropriate script for your credential format: either `test-jwt.sh` (for JWT) or `test-mdoc.sh` (for mDoc).
- Both scripts require a single argument: the `CREDENTIAL_OFFER_DEEP_LINK`.
- Both scripts set the following environment variables:
  - `CREDENTIAL_FORMAT`: `"jwt" `or `"mdoc"`
  - `CREDENTIAL_OFFER_DEEP_LINK`: your credential offer deep link
  - `CRI_DOMAIN`: domain of the credential issuer under test
  - `WALLET_SUBJECT_ID`: dummy wallet identifier
  - `CLIENT_ID`: dummy test client ID

- The script will:
   - Build a Docker image (`test-harness`) containing all dependencies and test code. 
   - Run a Docker container, mounting an output directory for test results and passing required configuration via environment variables.

**2. Test Execution**
- The container runs the `run-server-and-tests.sh` script, which:
   - Starts the test server (`run-server.sh`) - a mock of the One Login authorization server. 
   - Waits 5 seconds for the server to start. 
   - Executes the test suite (`run-tests.sh`) against the credential issuer. 
   - Exits when either process completes.

**3. Credential Format-Specific Testing**
- The test suite uses a helper function to determine which tests to run based on the credential format. This allows the same test suite to be reused for both formats, skipping irrelevant tests automatically.


```typescript
const CREDENTIAL_FORMAT = getCredentialFormat(); // CREDENTIAL_FORMAT environment variable
const shouldRun = (types: string[]) => types.includes(CREDENTIAL_FORMAT);
const JWT_ONLY = ['jwt'];
const MDOC_ONLY = ['mdoc'];
const JWT_AND_MDOC = ['jwt', 'mdoc'];

(shouldRun(JWT_ONLY) ? describe : describe.skip)("JWT-specific tests", () => {
  // These tests only run when CREDENTIAL_FORMAT="jwt"
});

(shouldRun(MDOC_ONLY) ? describe : describe.skip)("mDoc-specific tests", () => {
  // These tests only run when CREDENTIAL_FORMAT="mdoc"
});

(shouldRun(JWT_AND_MDOC) ? describe : describe.skip)("JWT and mDoc tests", () => {
  // These tests run when CREDENTIAL_FORMAT="jwt" or CREDENTIAL_FORMAT="mdoc"
});
```
## Usage

### Pre-requisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.

### Running Tests

#### For JWT Credential Issuers

```
./test-jwt.sh <CREDENTIAL_OFFER_DEEP_LINK>
```

#### For mDoc Credential Issuers

```
./test-mdoc.sh <CREDENTIAL_OFFER_DEEP_LINK>
```

- Replace `<CREDENTIAL_OFFER_DEEP_LINK>` with the actual credential offer deep link.
- Test results will be saved in the `output` directory.
