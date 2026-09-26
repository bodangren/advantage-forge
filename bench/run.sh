#!/usr/bin/env bash
# One Forge Bench run: prepare -> agent (isolated container) -> grade -> judge -> score.
#
#   bench/run.sh <provider> <model> <arm a|b> <brief-id> [run-id]
#
# Arm a = No Skills, arm b = Skills (the forge-assets skill is mounted and loaded). Both arms get
# the same repo, AGENTS.md, and prompt.
#
# Calibration (no agent): AGENT_SKIP=assets/horned-boar.ts bench/run.sh local reference a horned-boar cal-horned-boar
#
# Environment: BENCH_MINUTES (default 45), THINKING (default high), BENCH_VISION (0/1 override),
# BENCH_GPU=1 (pass /dev/dri), JUDGE=0 (skip judging), BENCH_PI_MODELS (pi models.json),
# BENCH_ENV_FILE (extra env file with the provider key).
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

PROVIDER="${1:?usage: run.sh <provider> <model> <a|b> <brief-id> [run-id]}"
MODEL="${2:?}"
ARM="${3:?}"
BRIEF_ID="${4:?}"
case "$ARM" in a|b) ;; *) echo "arm must be a or b" >&2; exit 2 ;; esac
SLUG="$(printf '%s' "$MODEL" | tr '.' '-' | tr -c 'A-Za-z0-9_-' '-')"
RUN_ID="${5:-$ARM-$BRIEF_ID-$SLUG-$(date -u +%Gw%V)-r1}"
[[ "$RUN_ID" =~ ^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$ ]] || { echo "unsafe run id: $RUN_ID" >&2; exit 2; }

BRIEF_JSON="$BENCH/briefs/$BRIEF_ID.json"
[ -f "$BRIEF_JSON" ] || BRIEF_JSON="$BENCH/briefs/calibration/$BRIEF_ID.json"
[ -f "$BRIEF_JSON" ] || { echo "unknown brief: $BRIEF_ID" >&2; exit 2; }

RUN="$BENCH/runs/$RUN_ID"
rm -rf "$RUN"
mkdir -p "$RUN"
MINUTES="${BENCH_MINUTES:-45}"
THINKING="${THINKING:-high}"

vision="${BENCH_VISION:-}"
if [ -z "$vision" ]; then
  vision=$(node -e 'const m=require(process.argv[1]).models.find(x=>x.id===process.argv[2]); process.stdout.write(m&&m.vision===true?"1":"0")' "$BENCH/config/models.json" "$MODEL")
fi

"$TSX" "$BENCH/prepare.ts" "$RUN" "$BRIEF_JSON" "$ARM" "$vision" "$MINUTES"
CAND="$RUN/candidate"

skill_dir="$REPO/.claude/skills/forge-assets"
harness_digest=$(cd "$BENCH" && find . -path ./runs -prune -o -path ./site -prune -o -type f -print | sort | xargs sha256sum | sha256sum | cut -c1-16)
skill_digest=$(cd "$skill_dir" && find . -type f | sort | xargs sha256sum | sha256sum | cut -c1-16)
started=$(date -u +%FT%TZ)
agent_status="skipped"
agent_code=0
agent_seconds=0

if [ -n "${AGENT_SKIP:-}" ]; then
  # Calibration: grade a known asset through the same pipeline without invoking a model.
  cp "$REPO/$AGENT_SKIP" "$CAND/assets/$BRIEF_ID.ts"
else
  command -v podman >/dev/null || { echo "podman is required" >&2; exit 2; }
  [ -x "$BENCH_PI_ROOT/bin/pi" ] || { echo "pi installation not found (set BENCH_PI_ROOT)" >&2; exit 2; }
  case "$PROVIDER" in
    opencode-go) secret="${BENCH_PROVIDER_ENV:-OPENCODE_API_KEY}" ;;
    anthropic) secret="${BENCH_PROVIDER_ENV:-ANTHROPIC_API_KEY}" ;;
    openai) secret="${BENCH_PROVIDER_ENV:-OPENAI_API_KEY}" ;;
    openrouter) secret="${BENCH_PROVIDER_ENV:-OPENROUTER_API_KEY}" ;;
    *) secret="${BENCH_PROVIDER_ENV:?set BENCH_PROVIDER_ENV to the provider key variable name}" ;;
  esac
  [ -n "${!secret:-}" ] || { echo "$secret is not set (put it in bench/.env.local or set BENCH_ENV_FILE)" >&2; exit 2; }

  # A private pi config dir: provider models (with image input when the model has vision).
  pi_dir="$RUN/pi-agent"
  mkdir -p "$pi_dir"
  if [ -n "${BENCH_PI_MODELS:-}" ]; then
    cp "$BENCH_PI_MODELS" "$pi_dir/models.json"
  elif [ -f "$HOME/Desktop/lending-desk-bench/harness/go-cost.ts" ]; then
    (cd "$HOME/Desktop/lending-desk-bench/harness" && ./node_modules/.bin/tsx go-cost.ts --models-json) > "$pi_dir/models.json"
  fi
  if [ -f "$pi_dir/models.json" ] && [ "$vision" = "1" ]; then
    node -e 'const fs=require("fs"),f=process.argv[1],id=process.argv[2]; const j=JSON.parse(fs.readFileSync(f,"utf8")); for (const p of Object.values(j.providers||{})) for (const m of p.models||[]) if (m.id===id) m.input=["text","image"]; fs.writeFileSync(f,JSON.stringify(j,null,2));' "$pi_dir/models.json" "$MODEL"
  fi

  podman_args=(run --rm --pull=never --read-only
    --tmpfs /tmp:rw,nosuid,nodev,size=2g
    --cap-drop=ALL
    --security-opt=no-new-privileges
    --userns=keep-id
    --user "$(id -u):$(id -g)"
    --network slirp4netns:allow_host_loopback=false
    --workdir /workspace
    --env HOME=/tmp
    --env XDG_CONFIG_HOME=/tmp/config
    --env XDG_CACHE_HOME=/tmp/cache
    --env PI_CODING_AGENT_DIR=/tmp/pi
    --env PI_TELEMETRY=0
    --env FORGE_VITE_CACHE=/tmp/vite
    --env PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
    --env "$secret"
    --mount "type=bind,src=$CAND,dst=/workspace,rw"
    --mount "type=bind,src=$REPO/node_modules,dst=/workspace/node_modules,ro"
    --mount "type=bind,src=$HOME/.cache/ms-playwright,dst=/opt/ms-playwright,ro"
    --mount "type=bind,src=$BENCH_PI_ROOT,dst=/opt/pi,ro"
    --mount "type=bind,src=$pi_dir,dst=/tmp/pi,rw")
  if [ "${BENCH_GPU:-0}" = "1" ] && [ -e /dev/dri ]; then
    podman_args+=(--device /dev/dri --group-add keep-groups)
  else
    podman_args+=(--env FORGE_GL=software)
  fi
  pi_flags=(--no-extensions --no-prompt-templates --no-themes --no-context-files)
  if [ "$ARM" = "a" ]; then
    pi_flags+=(--no-skills)
  else
    podman_args+=(--mount "type=bind,src=$skill_dir,dst=/opt/skills/forge-assets,ro")
    pi_flags+=(--no-skills --skill /opt/skills/forge-assets)
  fi

  t0=$(date +%s)
  set +e
  podman "${podman_args[@]}" --entrypoint /usr/bin/timeout localhost/forge-bench-agent:1 \
    $((MINUTES * 60 + 300)) /opt/pi/bin/pi \
    --provider "$PROVIDER" --model "$MODEL" --print --mode json --no-session --thinking "$THINKING" --approve \
    "${pi_flags[@]}" "$(cat "$RUN/prompt.md")" > "$RUN/transcript.jsonl" 2> "$RUN/agent.stderr"
  agent_code=$?
  set -e
  agent_seconds=$(( $(date +%s) - t0 ))
  # pi streams every token as a message_update event; the turn_end events keep the full messages.
  grep -v '"type":"message_update"' "$RUN/transcript.jsonl" > "$RUN/transcript.tmp" && mv "$RUN/transcript.tmp" "$RUN/transcript.jsonl" || true
  agent_status=$([ "$agent_code" = 124 ] && echo timeout || echo finished)
fi

node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({schema:1, run_id:process.argv[2], provider:process.argv[3], model:process.argv[4], arm:process.argv[5], brief:process.argv[6], vision:process.argv[7]==="1", minutes:Number(process.argv[8]), thinking:process.argv[9], started:process.argv[10], agent:{status:process.argv[11], exit_code:Number(process.argv[12]), seconds:Number(process.argv[13])}, harness_digest:process.argv[14], skill_digest:process.argv[15]}, null, 2))' \
  "$RUN/meta.json" "$RUN_ID" "$PROVIDER" "$MODEL" "$ARM" "$BRIEF_ID" "$vision" "$MINUTES" "$THINKING" "$started" \
  "$agent_status" "$agent_code" "$agent_seconds" "$harness_digest" "$skill_digest"
[ -f "$RUN/transcript.jsonl" ] && "$TSX" "$BENCH/usage.ts" "$RUN" || true

"$TSX" "$BENCH/grade.ts" "$RUN"
if [ "${JUDGE:-1}" != "0" ]; then "$TSX" "$BENCH/judge.ts" "$RUN"; fi
"$TSX" "$BENCH/score.ts" "$RUN"
