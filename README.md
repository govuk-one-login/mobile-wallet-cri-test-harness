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
Build the assets:
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
docker run --rm -v ./output:/results test-harness
```
