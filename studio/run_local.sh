#!/usr/bin/env bash
# Local runner for the Claude Code path. Usage:
#   studio/run_local.sh run <url-or-file>      run one job synchronously
#   studio/run_local.sh status [job_id]
#   studio/run_local.sh rerun <job_id> [--from STAGE]
#   studio/run_local.sh heygen-looks
#   studio/run_local.sh serve                  API + UI on http://127.0.0.1:8080, worker alongside
# Data lives in studio/.local/ (git-ignored). Secrets come from work/.secrets/studio.env and,
# if present, ~/.config/watch/.env (Groq key) — sourced, never printed.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
# Never inherit another tool's Anthropic routing (Claude Code sets these for itself).
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_MODEL ANTHROPIC_PROFILE
set -a
[ -f "$ROOT/work/.secrets/studio.env" ] && . "$ROOT/work/.secrets/studio.env"
[ -z "${GROQ_API_KEY:-}" ] && [ -f "$HOME/.config/watch/.env" ] && . "$HOME/.config/watch/.env"
set +a
export STUDIO_DB="$HERE/.local/studio.sqlite" STUDIO_UPLOADS="$HERE/.local/uploads" STUDIO_JOBS="$HERE/.local/jobs"
export STUDIO_COOKIES_FILE="${STUDIO_COOKIES_FILE:-$ROOT/work/.secrets/instagram-cookies.txt}"
mkdir -p "$HERE/.local"
[ -x "$HERE/.venv/bin/python" ] || { python3 -m venv "$HERE/.venv" && "$HERE/.venv/bin/pip" install -q -r "$HERE/requirements.txt"; }
PY="$HERE/.venv/bin/python"
cd "$HERE"
case "${1:-}" in
  serve)
    "$PY" -m app.worker & WORKER=$!
    trap 'kill $WORKER 2>/dev/null' EXIT
    exec "$PY" -m uvicorn app.main:app --host 127.0.0.1 --port 8080 ;;
  run|status|rerun|heygen-looks) exec "$PY" -m app.cli "$@" ;;
  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
