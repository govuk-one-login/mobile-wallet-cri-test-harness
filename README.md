# GOV.UK Wallet credential issuer test harness

## Overview

The GOV.UK Wallet test harness lets you validate your credential issuance implementation without using the GOV.UK One Login app.

There is more guidance on GOV.UK Wallet in the [technical documentation](https://docs.wallet.service.gov.uk/).

## What the test harness supports

The test harness takes your credential offer as its input and validates it, then runs tests against all the credential issuer endpoints that GOV.UK Wallet would call.

The test harness simulates valid and invalid calls to the:

* issuer [metadata API](https://docs.wallet.service.gov.uk/issue-a-credential/metadata/) (`/.well-known/openid-credential-issuer`)
* [credential API](https://docs.wallet.service.gov.uk/issue-a-credential/credential/) (path taken from issuer metadata API)
* [JWKS API](https://docs.wallet.service.gov.uk/issue-a-credential/jwks/) (`/.well-known/jwks.json`)
* [did:web API](https://docs.wallet.service.gov.uk/issue-a-credential/did/) (`/.well-known/did.json`)
* IACAS API (`/.well-known/iacas`)
* [notification API](https://docs.wallet.service.gov.uk/issue-a-credential/notification/) (path taken from issuer metadata API)

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

When configuring your pre-authorised code’s [JWT payload](https://docs.wallet.service.gov.uk/issue-a-credential/credential-offer/#jwt-payload), make sure the `aud` claim is set to the test harness domain (not the GOV.UK One Login authorisation server).

### Get test harness files

Clone the repo:

```
git clone git@github.com:govuk-one-login/mobile-wallet-cri-test-harness.git
```

### Run test script

Run the test harness with your credential format and credential offer deep link:

```
./run-test-harness.sh <CREDENTIAL_FORMAT> <CREDENTIAL_OFFER_DEEP_LINK>
```

Replace:
* `<CREDENTIAL_FORMAT>` with either `jwt` or `mdoc`
* `<CREDENTIAL_OFFER_DEEP_LINK>` with your credential offer deep link

You can optionally configure the following using command-line flags:

* `--cri-url`: URL of the credential issuer under test (default: `http://localhost:8080`)
* `--wallet-subject-id`: the walletSubjectId your service is expecting (default: `urn:fdc:wallet.account.gov.uk:2024:DtPT8x-dp_73tnlY3KNTiCitziN9GEherD16bqxNt9i`)
* `--client-id`: the GOV.UK One Login client ID of your service (default: `TEST_CLIENT_ID`)
* `--has-notification-endpoint`: boolean indicating whether the CRI implements the notification endpoint (default: `true`)
* `--container-name`: Docker container name (default: `test-harness`)
* `--network-name`: Docker network name (default: `bridge`)
* `--test-harness-url`: Test harness URL (auto-derived from `--network-name` and `--container-name` if not set)

For example:

```
./run-test-harness.sh jwt "https://mobile.build.account.gov.uk/wallet/add?credential_offer..." --cri-url http://localhost:8080 --client-id YOUR_CLIENT_ID
```

The test script:

* builds a Docker image (`test-harness`) containing all dependencies and test code
* runs a Docker container, mounting an output directory for test results and passing required configuration via environment variables

### Execute tests

The container runs the `run-server-and-tests.sh` script, which:

* starts the test server (`run-server.sh`)
* waits 5 seconds for the server to start
* executes the test suite (`run-tests.sh`) against the credential issuer
* exits when the test suite finishes executing
* saves test results in `./output/report.xml`

## Disclaimers

* This implementation supports the credential issuance journeys as specified in the [GOV.UK Wallet technical documentation](https://docs.wallet.service.gov.uk/).
* This is not production code.
* You should check that you are using the latest version of this implementation.
* This implementation may change, add or remove features, which may make it incompatible with your code.
* This implementation is limited in scope.
* This implementation must not replace your own testing - you must perform sufficient testing to properly evaluate your application and its production readiness.

## Contact us

If you have questions or suggestions, contact us on [govukwallet-queries@digital.cabinet-office.gov.uk](mailto:govukwallet-queries@digital.cabinet-office.gov.uk) or use #govuk-wallet in x-gov Slack.
