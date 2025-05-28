#!/bin/bash

# Start the first process
echo "Starting server"
bash run-server.sh &

sleep 5

# Start the second process
echo "Running tests against the credential issuer"
bash run-tests.sh &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
echo "Exiting with code " $?
exit $?
