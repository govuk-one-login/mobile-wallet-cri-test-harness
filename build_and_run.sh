#!/bin/bash

echo "Attempting to build Docker image"
docker build --no-cache -t "test-harness" .

echo "Attempting to run image in a container"
docker run --rm -v ./output:/results -p 3001:3001 -e CREDENTIAL_OFFER_DEEP_LINK=$1 -e CRI_DOMAIN="localhost:8080" -e WALLET_SUBJECT_ID="urn:fdc:wallet.account.gov.uk:2024:DtPT8x-dp_73tnlY3KNTiCitziN9GEherD16bqxNt9i" -e CLIENT_ID="TEST_CLIENT_ID" test-harness