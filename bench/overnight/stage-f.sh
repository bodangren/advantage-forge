#!/usr/bin/env bash
# Moves each queue-f.tsv row once its mockup exists: rows for the coding-plan and volcengine plans go to
# queue-hold.tsv before 13:23 (their quota resets then), all other rows go to queue.tsv.
cd "$(dirname "$0")"
while [ -s queue-f.tsv ]; do
  : > queue-f.keep
  while IFS=$'\t' read -r name model prompt refs root; do
    [ -z "$name" ] && continue
    row=$(printf '%s\t%s\t%s\t%s\t%s' "$name" "$model" "$prompt" "$refs" "$root")
    if [ -f "../../$refs/$name-mock.jpg" ]; then
      case "$model" in
        coding-plan/*|volcengine-agent-plan/*) [ "$(date +%H%M)" -lt 1323 ] && dest=queue-hold.tsv || dest=queue.tsv ;;
        *) dest=queue.tsv ;;
      esac
      printf '%s\n' "$row" >> "$dest"
      echo "$(date +%H:%M:%S) staged $name $model -> $dest" >> stage-f.log
    else
      printf '%s\n' "$row" >> queue-f.keep
    fi
  done < queue-f.tsv
  mv queue-f.keep queue-f.tsv
  sleep 30
done
