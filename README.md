# Wallet Credential Issuer Test Harness

## Overview - What the test harness does

This test harness enables GOV.UK Wallet credential issuer services to validate their implementations without requiring access to the mobile app. It acts as a mock wallet client that can test credential issuance flows end-to-end.

## How to use it - Running the test suite against a credential issuer

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


## How It Works - Technical details and implementation

**1. Start the Test Harness**
- Use the appropriate script for your credential format: either `test-jwt.sh` (for JWT) or `test-mdoc.sh` (for mDoc).
- Both scripts require a single argument: the `CREDENTIAL_OFFER_DEEP_LINK`.
- Both scripts set the following environment variables:
  - `CREDENTIAL_FORMAT`: `"jwt" `or `mdoc`
  - `CREDENTIAL_OFFER_DEEP_LINK`: your credential offer deep link
  - `CRI_DOMAIN`: domain of the credential issuer under test
  - `WALLET_SUBJECT_ID`: dummy wallet identifier
  - `CLIENT_ID`: dummy test client ID
  - `HAS_NOTIFICATION_ENDPOINT`: boolean indicating whether the CRI implements the notification endpoint - defaults to `"true"`

- The script will:
   - Build a Docker image (`test-harness`) containing all dependencies and test code. 
   - Run a Docker container, mounting an output directory for test results and passing required configuration via environment variables.

**Note:** The environment variables can be updated by opening the`test-jwt.sh` or `test-mdoc.sh` bash scripts and applying the new values to the `docker run` command.

**2. Test Execution**
- The container runs the `run-server-and-tests.sh` script, which:
   - Starts the test server (`run-server.sh`) - a mock of the One Login authorization server. 
   - Waits 5 seconds for the server to start. 
   - Executes the test suite (`run-tests.sh`) against the credential issuer. 
   - Exits when either process completes.

**3. Conditional Tests**
- The test suite uses conditional test helpers to run different tests based off the value of `HAS_NOTIFICATION_ENDPOINT` and `CREDENTIAL_FORMAT`:

```typescript
// JWT credential tests - only run when CREDENTIAL_FORMAT="jwt"
describeIf("JWT tests", isJwt(), () => {
  // JWT-specific test cases
});

// mDoc credential tests - only run when CREDENTIAL_FORMAT="mdoc"  
describeIf("mDoc tests", isMdoc(), () => {
  // mDoc-specific test cases
});

// Notification tests - only run when HAS_NOTIFICATION_ENDPOINT="true"
itIf("notification endpoint test", hasNotificationEndpoint(), () => {
  // Tests that notification endpoint
});

```
