#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
node --experimental-strip-types scripts/doctor.ts "$@"
