# GOV.UK Wallet credential issuer test harness

## Overview

The GOV.UK Wallet test harness lets you validate your credential issuance implementation without using the mobile app.

There is more guidance on GOV.UK Wallet in the [technical documentation](https://docs.wallet.service.gov.uk/).

## What the test harness supports

The test harness takes your credential offer as its input and validates it, then runs tests against all the credential issuer endpoints that GOV.UK Wallet would call.

The test harness simulates valid and invalid calls to the:

* issuer [metadata API](https://docs.wallet.service.gov.uk/credential-issuer-functionality/metadata/) (`/.well-known/openid-credential-issuer`)
* [credential API](https://docs.wallet.service.gov.uk/credential-issuer-functionality/credential/) (path taken from issuer metadata API)
* [JWKS API](https://docs.wallet.service.gov.uk/credential-issuer-functionality/jwks/) (`/.well-known/jwks.json`)
* [did:web API](https://docs.wallet.service.gov.uk/credential-issuer-functionality/did/) (`/.well-known/did.json`)
* IACAS API (`/.well-known/iacas`)
* [notification API](https://docs.wallet.service.gov.uk/credential-issuer-functionality/notification/) (path taken from issuer metadata API)

After simulating calls to these endpoints, the test harness validates the responses returned by checking that:

* the status code is as expected
* the response body is as expected, including checking mandatory fields and verifying cryptographic signatures
* the headers are as expected

These checks validate that the credential issuer is implemented correctly.

When the test harness finishes testing, it produces a test report detailing the tests that passed and failed.

The test harness does not test all possible unhappy paths.

## Before you start

[Docker](https://docs.docker.com/get-started/get-docker/) must be installed on your machine.

## Run the test harness

### Configure credential issuer

You must set up your credential issuer so that it uses the test harness domain to fetch the public signing key that validates the credential access token.

When configuring your pre-authorised code’s [JWT payload](https://docs.wallet.service.gov.uk/credential-issuer-functionality/credential-offer/#jwt-payload), make sure the `aud` claim is set to the test harness domain (not the GOV.UK One Login authorisation server).

### Get test harness files

Clone the repo:

```
git clone git@github.com:govuk-one-login/mobile-wallet-cri-test-harness.git
```

### Set environment variables

You must set the relevant environment variables before running the test script.

From the cloned repo, open the correct script for your credential type:

* `test-jwt.sh` for JWT credential issuers
* `test-mdoc.sh` for mdoc credential issuers

Apply the following values to the docker run command:

* `CRI_DOMAIN`: domain of the credential issuer under test
* `WALLET_SUBJECT_ID`: the walletSubjectId your service is expecting
* `CLIENT_ID`: the GOV.UK One Login client ID of your service
* `HAS_NOTIFICATION_ENDPOINT`: boolean indicating whether the CRI implements the notification endpoint - defaults to `"true"`

### Run test script

Use the correct test script for your credential format.

JWT credential issuers must run:

```
./test-jwt.sh <CREDENTIAL_OFFER_DEEP_LINK>
```

mdoc credential issuers must run:

```
./test-mdoc.sh <CREDENTIAL_OFFER_DEEP_LINK>
```

Replace the `<CREDENTIAL_OFFER_DEEP_LINK>` with your credential offer deep link.

The test script:

* builds a Docker image (`test-harness`) containing all dependencies and test code
* runs a Docker container, mounting an output directory for test results and passing required configuration via environment variables

### Execute tests

The container runs the `run-server-and-tests.sh` script, which:

* starts the test server (`run-server.sh`)
* waits 5 seconds for the server to start
* executes the test suite (`run-tests.sh`) against the credential issuer
* exits when the test suite finishes executing
* saves test results in the output directory

## Disclaimers

* This implementation supports the credential issuance journeys as specified in the [GOV.UK Wallet technical documentation](https://docs.wallet.service.gov.uk/).
* This is not production code.
* You should check that you are using the latest version of this implementation.
* This implementation may change, add or remove features, which may make it incompatible with your code.
* This implementation is limited in scope.
* This implementation must not replace your own testing - you must perform sufficient testing to properly evaluate your application and its production readiness.

## Contact us

If you have questions or suggestions, contact us on [govukwallet-queries@digital.cabinet-office.gov.uk](mailto:govukwallet-queries@digital.cabinet-office.gov.uk) or use #govuk-wallet in x-gov Slack.
