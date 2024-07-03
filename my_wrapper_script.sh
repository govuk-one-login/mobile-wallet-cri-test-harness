#!/bin/bash

# Start the first process
bash my_first_process.sh &

sleep 15

# Start the second process
bash my_second_process.sh &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
echo $?
exit $?
