#!/usr/bin/env bash
# Create the pinned earshot venv for scripts/sound-set.mjs.
# The venv lives in .venv-earshot/ and is gitignored. Host Python and node_modules stay unchanged.
set -euo pipefail
cd "$(dirname "$0")/.."

create_venv() {
  for candidate in "${PYTHON:-}" python3 python3.12 python3.11; do
    [ -n "$candidate" ] || continue
    command -v "$candidate" >/dev/null 2>&1 || continue
    rm -rf .venv-earshot
    if "$candidate" -m venv .venv-earshot >/dev/null 2>&1; then
      return 0
    fi
  done
  return 1
}

if [ ! -x .venv-earshot/bin/python ]; then
  create_venv || { echo "sound-setup: no Python with venv support found" >&2; exit 1; }
fi

.venv-earshot/bin/pip install "earshot @ git+https://github.com/Leonxlnx/earshot@7a7f7c5c70d4a763a1eca4b3666af7c77e313f97"
.venv-earshot/bin/earshot --version
