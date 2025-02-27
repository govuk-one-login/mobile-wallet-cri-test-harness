# mobile-wallet-cri-test-harness

## Overview

A tool for testing a Wallet credential issuer service.

## Pre-requisites

- [Node.js](https://nodejs.org/en/) (>= 20.11.1)
- [NPM](https://www.npmjs.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [Homebrew](https://brew.sh)

We recommend using [nvm](https://github.com/nvm-sh/nvm) to install and manage Node.js versions.

To install nvm, run:
```
brew install nvm
```

Then, to install and use the required version of node using nvm, run the following commands:
```
nvm install
```

```
nvm use
```

## Quickstart

### Install

Install the dependencies with:
```
npm install
```

### Lint & Format

Lint and format the code with:
```
npm run lint --fix
```

```
npm run format
```

### Build

Build the assets with:
```
npm run build
```

### Test

Run unit tests with:
```
npm run test:unit
```

### Credential Issuer Tests
To run tests against a credential issuer, run:

```
./build_and_run.sh <credential_offer_deep_link>
```

The `<credential_offer_deep_link>` is the credential offer deep link you wish to test with.
