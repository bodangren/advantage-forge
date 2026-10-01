#!/usr/bin/env bash
set -euo pipefail

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
exec node "$root/measure/tools/doctor.mjs" "$@" --root "$root"
