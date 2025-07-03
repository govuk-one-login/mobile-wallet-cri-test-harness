#!/bin/bash

# Check for exactly two arguments
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <CREDENTIAL_TYPE> <CREDENTIAL_OFFER_DEEP_LINK>"
  exit 1
fi

CREDENTIAL_TYPE="$1"
CREDENTIAL_OFFER_DEEP_LINK="$2"

# Validate CREDENTIAL_TYPE
if [ "$CREDENTIAL_TYPE" != "mDL" ] && [ "$CREDENTIAL_TYPE" != "JWT" ]; then
  echo "Error: CREDENTIAL_TYPE must be either 'mDL' or 'JWT'"
  exit 1
fi

echo "Credential type: $CREDENTIAL_TYPE"

echo "Attempting to build Docker image"
docker build -t "test-harness" .

echo "Attempting to run image in a container"
docker run --rm -v ./output:/results -p 3001:3001 -e CREDENTIAL_TYPE=$CREDENTIAL_TYPE CREDENTIAL_OFFER_DEEP_LINK=$CREDENTIAL_OFFER_DEEP_LINK -e CRI_DOMAIN="localhost:8080" -e WALLET_SUBJECT_ID="urn:fdc:wallet.account.gov.uk:2024:DtPT8x-dp_73tnlY3KNTiCitziN9GEherD16bqxNt9i" -e CLIENT_ID="TEST_CLIENT_ID" test-harness