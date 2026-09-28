#!/usr/bin/env bash
# Move held queue rows of one provider back into the queue: release-hold.sh <provider>
cd "$(dirname "$0")" || exit 1
p="$1"
grep -P "\t$p/" queue-hold.tsv >> queue.tsv
grep -vP "\t$p/" queue-hold.tsv > queue-hold.tmp; mv queue-hold.tmp queue-hold.tsv
echo "released $p: queue $(wc -l < queue.tsv), hold $(wc -l < queue-hold.tsv)"
