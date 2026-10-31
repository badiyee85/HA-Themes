#!/usr/bin/env bash
# Usage: tools/shoot.sh <label> [extra playwright args, e.g. -g persists]
# Boots isolated Hermes Desktops under Xvfb (sandbox HOME, real `hermes serve`, faked LLM),
# installs the built desktop/plugin.js the way the README says, and writes screenshots +
# measurements to shots/run-<label>/. Never touches the real ~/.hermes.
#
# Env: HERMES_SRC   Hermes checkout with a built Desktop (default ~/.hermes/hermes-agent)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="${1:?label}"
HERMES_SRC="${HERMES_SRC:-$HOME/.hermes/hermes-agent}"
python3 "$ROOT/tools/build.py"
export OUT="$ROOT/shots/run-$LABEL"
export PACK_ROOT="$ROOT"
export HERMES_E2E_CORE_ROOT="${HERMES_E2E_CORE_ROOT:-$HOME/.hermes/cache/scratch/ha-themes-e2e}"
export HERMES_E2E_PYTHON="${HERMES_E2E_PYTHON:-$HERMES_SRC/venv/bin/python}"
export HERMES_E2E_REPO="$HERMES_SRC"
# The spec imports the upstream core harness through these links. They exist only for the
# run: a symlink left in the package folder fails `hermes plugins validate` (symlink_escape).
cleanup() { rm -f "$ROOT/tools/hermes-src" "$ROOT/tools/node_modules"; }
trap cleanup EXIT
ln -sfn "$HERMES_SRC" "$ROOT/tools/hermes-src"
ln -sfn "$HERMES_SRC/node_modules" "$ROOT/tools/node_modules"
rm -rf "$OUT"
cd "$ROOT/tools"
timeout 900 xvfb-run -a -s "-screen 0 1920x1080x24" \
  "$HERMES_SRC/node_modules/.bin/playwright" test -c playwright.config.ts "${@:2}"
