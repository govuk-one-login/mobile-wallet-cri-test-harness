#!/bin/bash

# Start the first process
bash run_server.sh &

sleep 20

# Start the second process
bash run_tests.sh &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
echo "Existing with code " $?
exit $?
