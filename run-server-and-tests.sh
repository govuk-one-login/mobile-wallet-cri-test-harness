#!/bin/bash

echo "Starting server"
bash run-server.sh &
SERVER_PID=$!

sleep 5

echo "Running tests against the credential issuer"
bash run-tests.sh
TEST_EXIT_CODE=$?

echo "Stopping server"
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null || true

echo "Exiting with code $TEST_EXIT_CODE"
exit $TEST_EXIT_CODE
