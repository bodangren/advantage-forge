#!/usr/bin/env bash
# Waits until the given HHMM, then releases the held Kimi rows and interleaves the queue.
cd "$(dirname "$0")"
until [ "$(date +%H%M)" -ge "$1" ]; do sleep 30; done
touch STOP; while kill -0 "$(cat scheduler.pid)" 2>/dev/null; do sleep 2; done; rm -f STOP
./release-hold.sh coding-plan; ./release-hold.sh volcengine-agent-plan
python3 interleave.py && mv queue.tsv.next queue.tsv
cd ../.. && setsid nohup bench/overnight/scheduler.sh "${2:-6}" 2 > /dev/null 2>&1 < /dev/null &
echo "$(date +%H:%M:%S) release-at: released and interleaved" >> scheduler.log
