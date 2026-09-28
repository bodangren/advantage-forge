#!/usr/bin/env bash
# release-at2.sh HHMM provider [limit]: at HHMM, release the provider's held rows and interleave the queue.
cd "$(dirname "$0")"
until [ "$(date +%H%M)" -ge "$1" ]; do sleep 30; done
touch STOP; while kill -0 "$(cat scheduler.pid)" 2>/dev/null; do sleep 2; done; rm -f STOP
./release-hold.sh "$2"
python3 interleave.py && mv queue.tsv.next queue.tsv
cd ../.. && setsid nohup bench/overnight/scheduler.sh "${3:-6}" 2 > /dev/null 2>&1 < /dev/null &
echo "$(date +%H:%M:%S) release-at2: released $2 and interleaved" >> scheduler.log
