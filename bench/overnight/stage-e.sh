#!/usr/bin/env bash
# Moves each queue-e.tsv row into queue.tsv once its mockup exists; ends when queue-e.tsv is empty.
cd "$(dirname "$0")"
while [ -s queue-e.tsv ]; do
  : > queue-e.keep
  while IFS=$'\t' read -r name model prompt refs root; do
    [ -z "$name" ] && continue
    if [ -f "../../$refs/$name-mock.jpg" ]; then
      printf '%s\t%s\t%s\t%s\t%s\n' "$name" "$model" "$prompt" "$refs" "$root" >> queue.tsv
      echo "$(date +%H:%M:%S) staged $name $model" >> stage-e.log
    else
      printf '%s\t%s\t%s\t%s\t%s\n' "$name" "$model" "$prompt" "$refs" "$root" >> queue-e.keep
    fi
  done < queue-e.tsv
  mv queue-e.keep queue-e.tsv
  sleep 30
done
