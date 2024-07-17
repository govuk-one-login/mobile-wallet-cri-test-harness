# mobile-wallet-cri-test-harness

## Overview
A tool for testing a Wallet credential issuer service.

## Pre-requisites
- [Homebrew package manager](https://brew.sh)
- [Docker](https://docs.docker.com/get-docker/)

**If you don't have node, or don't have a recent enough version installed:**

The project has been configured with nvm (node version manager). You can use this to install the right version of node.

To install nvm, run:
```
brew install nvm
```

To switch to the required version of node using nvm, run:
```
nvm install
nvm use
```

## Quickstart
### Installation
Install node dependencies:
```
npm install
```

### Formatting & Linting
Format the code:
```
npm run format
```

Lint the code:
```
npm run lint --fix
```

### Build
Build the application:
```
npm run build
```

### Test
Run the unit tests:
```
npm run test:unit
```

### Run
#### Running the Application
Build the Docker images:
```
docker build -t "test-harness" .  
```

Run the image inside a container:
```
docker run --rm -v ./output:/results -e CREDENTIAL_OFFER_DEEP_LINK="https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiNmM4ZjFlMjItNDM2NC00ZDMwLTgyZDAtZjZmNDU0NzBkMzdhIl0sImV4cCI6MTcyMTIxODgzOCwiaWF0IjoxNzIxMjE4NTM4fQ.anOHt0g5RXY80XcjVsU1KGYM4pCJB4ustDWvFMT-7_JHpjHRZHXbjUsCzv59aPO4GRvNRdxKnJw2YLogUfUQgw%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D" -e CRI_DOMAIN="host.docker.internal:8080" test-harness
```
