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
Build the Docker image:
```
docker build -t "test-harness" .  
```

Before running the image inside a container, replace the JWT with a new one in the command below.

Run the image:
```
docker run --rm -v ./output:/results -p 3001:3001 -e CREDENTIAL_OFFER_DEEP_LINK="https://mobile.build.account.gov.uk/wallet/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJ1cm46ZmRjOmdvdjp1azp3YWxsZXQiLCJjbGllbnRJZCI6IkVYQU1QTEVfQ1JJIiwiaXNzIjoidXJuOmZkYzpnb3Y6dWs6ZXhhbXBsZS1jcmVkZW50aWFsLWlzc3VlciIsImNyZWRlbnRpYWxfaWRlbnRpZmllcnMiOlsiMDU2ZGIzNjAtZDYzNi00MDk3LWJhZmEtMDc5YjBjN2FiMDNmIl0sImV4cCI6MTcyMTgyMjgyNiwiaWF0IjoxNzIxODIyNTI2fQ.qrg0F0EyAWXxeZU9pNevs7W0XaS708IzkLCbh19kIpifu5r7pp_lGR55jyqOyVT_EzbpsFY8z0Dw7Rsg7lA_vw%22%7D%7D%2C%22credential_issuer%22%3A%22http%3A%2F%2Flocalhost%3A8080%22%2C%22credentialIssuer%22%3A%22http%3A%2F%2Flocalhost%3A8080%22%7D" -e CRI_DOMAIN="host.docker.internal:8080" -e WALLET_SUBJECT_ID="urn:fdc:wallet.account.gov.uk:2024:DtPT8x-dp_73tnlY3KNTiCitziN9GEherD16bqxNt9i" test-harness
```
