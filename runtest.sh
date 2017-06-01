#!/usr/bin/env bash

echo "Running tests"

# Start PHP Server
php -S 127.0.0.1:8098 &
PHP_PID=$!

# Start browser that will run the tests
firefox http://127.0.0.1:8098/tests/?pid=$$ &

FAILED_TEST=false;

testFailed() {
    FAILED_TEST=true;
}

testsDone() {
    echo "All tests executed";
    kill -9 $PHP_PID

    if [ "$FAILED_TEST" = true ] ; then
        echo "At least one test failed, please check the logs"
        exit 1;
    fi

    exit 0;
}

trap testFailed USR1
trap testsDone USR2

while :	
do
        sleep 1	# This script is not really doing anything.
done