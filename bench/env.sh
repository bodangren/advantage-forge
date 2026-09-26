# Shared environment for bench scripts. Source it; do not run it.
# Loads bench/.env and bench/.env.local (never printed), then BENCH_ENV_FILE if set, for example
# the Lending Desk bench's .env.local that holds OPENCODE_API_KEY.
if [ -z "${_FORGE_BENCH_ENV:-}" ]; then
  BENCH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO="$(cd "$BENCH/.." && pwd)"
  _load_env_file() {
    local file="$1" line key val
    [ -f "$file" ] || return 0
    while IFS= read -r line || [ -n "$line" ]; do
      [[ "$line" =~ ^[[:space:]]*# ]] && continue
      [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
      key="${BASH_REMATCH[1]}"; val="${BASH_REMATCH[2]}"
      val="${val#\"}"; val="${val%\"}"; val="${val#\'}"; val="${val%\'}"
      [ -z "${!key:-}" ] && export "$key=$val"
    done < "$file"
  }
  _load_env_file "$BENCH/.env"
  _load_env_file "$BENCH/.env.local"
  [ -n "${BENCH_ENV_FILE:-}" ] && _load_env_file "$BENCH_ENV_FILE"
  if [ -z "${BENCH_PI_ROOT:-}" ] && command -v pi >/dev/null; then
    export BENCH_PI_ROOT="$(cd "$(dirname "$(command -v pi)")/.." && pwd)"
  fi
  export BENCH REPO
  export TSX="$REPO/node_modules/.bin/tsx"
  export _FORGE_BENCH_ENV=1
fi
