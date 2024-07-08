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

### Run
#### Running the Application
Build the Docker images:
```
docker build -t "test-harness" .  
```

Run the image inside a container:
```
docker run --rm -v ./output:/results -e CREDENTIAL_OFFER_DEEP_LINK="https://mobile.build.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiJlNDJjNmM2Zi1kMzhjLTQ0NjgtYjFiZC1jMDc2ZGUyMTAzYTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiOTIwMDBmMDktMTEwMS00OGZlLWE0YjgtNDc2NGQyNjdjMTA0Il0sImV4cCI6MTcyMDA5OTg4NywiaWF0IjoxNzIwMDk5NTg3fQ.wbg668HQjpaKivpHZ2SBWNJHTbBa6df4mhKz0TITymiTxMsZOpXJDo_WxK-Urgwpf91J9iv-Oq34lslGNXgTug%22%7D%7D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fexample-credential-issuer.mobile.dev.account.gov.uk%22%7D" test-harness
```
