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

### Unit Tests
```
npm run test:unit
```

### Credential Issuer Tests
Build the Docker image and run it inside a container (you must first replace the credential offer deep link with a new one):
```
bash build_and_run.sh https://mobile.dev.account.gov.uk/wallet-test/add?credential_offer=%7B%22credentials%22%3A%5B%22SocialSecurityCredential%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22eyJraWQiOiI3OGZhMTMxZDY3N2MxYWMwZjE3MmM1M2I0N2FjMTY5YTk1YWQwZDkyYzM4YmQ3OTRhNzBkYTU5MDMyMDU4Mjc0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjgwMDEiLCJjbGllbnRJZCI6IlRFU1RfQ0xJRU5UX0lEIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiY3JlZGVudGlhbF9pZGVudGlmaWVycyI6WyI0NzMxM2FlNC1jNTcwLTRmMzYtODA0NS0wNzM2ZTAzNTE1ODkiXSwiZXhwIjoxNzM2MTYzMTg5LCJpYXQiOjE3MzYxNjI4ODl9.7BVq6P9kag2lTKHLdN7h0gWu_lxDm6Z9fa9vF9Giz7z5xEzPjkCfboU7WDg-9aB4r27sfTaSSlQliXjPTAbmzw%22%7D%7D%2C%22credential_issuer%22%3A%22http%3A%2F%2Flocalhost%3A8080%22%7D
```

