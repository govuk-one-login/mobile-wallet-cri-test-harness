#!/bin/bash

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <CREDENTIAL_FORMAT> <CREDENTIAL_OFFER_DEEP_LINK> [--container-name name] [--network-name name] [--test-harness-url URL] [--cri-url URL] [--has-notification-endpoint bool] [--wallet-subject-id id] [--client-id id]"
  exit 1
fi

# Required positional arguments
CREDENTIAL_FORMAT="$1"
CREDENTIAL_OFFER_DEEP_LINK="$2"
shift 2

if [[ "$CREDENTIAL_FORMAT" != "jwt" && "$CREDENTIAL_FORMAT" != "mdoc" ]]; then
  echo "ERROR: Credential format must be either 'jwt' or 'mdoc'."
  exit 1
fi

# Default optional parameters
CONTAINER_NAME="test-harness"
NETWORK_NAME="bridge"
TEST_HARNESS_URL=""
CRI_URL="http://localhost:8080"
HAS_NOTIFICATION_ENDPOINT="true"
WALLET_SUBJECT_ID="urn:fdc:wallet.account.gov.uk:2024:DtPT8x-dp_73tnlY3KNTiCitziN9GEherD16bqxNt9i"
CLIENT_ID="TEST_CLIENT_ID"

# Parse optional flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --container-name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --network-name)
      NETWORK_NAME="$2"
      shift 2
      ;;
    --test-harness-url)
      TEST_HARNESS_URL="$2"
      shift 2
      ;;
    --cri-url)
      CRI_URL="$2"
      shift 2
      ;;
    --has-notification-endpoint)
      HAS_NOTIFICATION_ENDPOINT="$2"
      shift 2
      ;;
    --wallet-subject-id)
      WALLET_SUBJECT_ID="$2"
      shift 2
      ;;
    --client-id)
      CLIENT_ID="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done


# Derive TEST_HARNESS_URL if not explicitly set
if [[ -z "$TEST_HARNESS_URL" ]]; then
  if [[ "$NETWORK_NAME" == "bridge" ]]; then
    TEST_HARNESS_URL="http://localhost:3001"
  else
    TEST_HARNESS_URL="http://$CONTAINER_NAME:3001"
  fi
fi

echo "Running test harness with:
  CONTAINER_NAME=$CONTAINER_NAME
  NETWORK_NAME=$NETWORK_NAME
  TEST_HARNESS_URL=$TEST_HARNESS_URL
  CREDENTIAL_OFFER_DEEP_LINK=$CREDENTIAL_OFFER_DEEP_LINK
  CREDENTIAL_FORMAT=$CREDENTIAL_FORMAT
  CRI_URL=$CRI_URL
  HAS_NOTIFICATION_ENDPOINT=$HAS_NOTIFICATION_ENDPOINT
  WALLET_SUBJECT_ID=$WALLET_SUBJECT_ID
  CLIENT_ID=$CLIENT_ID
"

echo "Attempting to build Docker image"
if ! docker build -t "test-harness" .; then
    echo "ERROR: Docker build failed"
    exit 1
fi

echo "Attempting to run image in a container"
docker run --rm -v ./output:/workspace/results -p 3001:3001 \
  --name "$CONTAINER_NAME" \
  --network "$NETWORK_NAME" \
  -e TEST_HARNESS_URL="$TEST_HARNESS_URL" \
  -e CREDENTIAL_OFFER_DEEP_LINK="$CREDENTIAL_OFFER_DEEP_LINK" \
  -e CREDENTIAL_FORMAT="$CREDENTIAL_FORMAT" \
  -e CRI_URL="$CRI_URL" \
  -e HAS_NOTIFICATION_ENDPOINT="$HAS_NOTIFICATION_ENDPOINT" \
  -e WALLET_SUBJECT_ID="$WALLET_SUBJECT_ID" \
  -e CLIENT_ID="$CLIENT_ID" \
  test-harness
