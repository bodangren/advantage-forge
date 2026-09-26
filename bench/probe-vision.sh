#!/usr/bin/env bash
# Does a model see images through pi? Shows it a generated picture of a colored shape and checks
# the answer. Prints "vision: yes" or "vision: no"; record the result in config/models.json.
#
#   bench/probe-vision.sh <model> [provider]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
MODEL="${1:?usage: probe-vision.sh <model> [provider]}"
PROVIDER="${2:-opencode-go}"
dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT

# A 96x96 PNG: a solid orange triangle on white (no text, so only real vision can answer).
"$TSX" -e "
import { encodePng } from '$REPO/src/texture/png.ts';
import { writeFileSync } from 'node:fs';
const N = 96, px = new Uint8Array(N * N * 3).fill(255);
for (let y = 10; y < 86; y++) for (let x = 0; x < N; x++) if (Math.abs(x - 48) <= (y - 10) / 2) px.set([240, 120, 20], (y * N + x) * 3);
writeFileSync('$dir/shape.png', encodePng(N, N, 3, px));
"

pi_dir="$dir/pi"
mkdir -p "$pi_dir"
if [ -f "$HOME/Desktop/lending-desk-bench/harness/go-cost.ts" ]; then
  (cd "$HOME/Desktop/lending-desk-bench/harness" && ./node_modules/.bin/tsx go-cost.ts --models-json) > "$pi_dir/models.json"
  node -e 'const fs=require("fs"),f=process.argv[1],id=process.argv[2]; const j=JSON.parse(fs.readFileSync(f,"utf8")); for (const p of Object.values(j.providers||{})) for (const m of p.models||[]) if (m.id===id) m.input=["text","image"]; fs.writeFileSync(f,JSON.stringify(j));' "$pi_dir/models.json" "$MODEL"
fi
answer=$(cd "$dir" && PI_CODING_AGENT_DIR="$pi_dir" timeout 300 pi --provider "$PROVIDER" --model "$MODEL" --print --no-session \
  --no-skills --no-extensions --no-context-files --thinking low @shape.png \
  "Answer in five words or fewer: what shape is in this image, and what color is it?" 2>/dev/null || true)
echo "answer: $answer"
if printf '%s' "$answer" | grep -qi 'triangle' && printf '%s' "$answer" | grep -qiE 'orange|amber'; then
  echo "vision: yes"
else
  echo "vision: no"
fi
