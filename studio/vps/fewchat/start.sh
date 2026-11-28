#!/bin/sh
set -e
cd /app
cp /run/fewchat/dev.vars /app/.dev.vars
node /opt/db.mjs
# Cloudflare would fire the every-minute cron; here a tiny loop does it.
( sleep 25; while true; do curl -s -o /dev/null "http://127.0.0.1:8787/__scheduled?cron=*+*+*+*+*" || true; sleep 60; done ) &
exec npx wrangler dev --local --ip 0.0.0.0 --port 8787 --persist-to /data --test-scheduled --show-interactive-dev-session=false --log-level warn
