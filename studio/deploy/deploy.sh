#!/usr/bin/env bash
# Sync studio/ to the VPS and (re)build. Usage: studio/deploy/deploy.sh [host]
set -euo pipefail
HOST="${1:-amos-vps}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
rsync -az --delete --exclude .env --exclude '__pycache__' --exclude '.pytest_cache' \
  "$HERE/" "$HOST:/opt/withhammad-studio/"
ssh "$HOST" 'cd /opt/withhammad-studio && test -f .env || { echo "create /opt/withhammad-studio/.env from .env.example first"; exit 1; }
  docker compose up -d --build --remove-orphans && sleep 3 && docker compose ps && curl -fsS http://127.0.0.1:8080/healthz && echo'
