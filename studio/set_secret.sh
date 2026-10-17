#!/usr/bin/env bash
# Store one secret in work/.secrets/studio.env without it ever appearing on screen or in chat.
#   studio/set_secret.sh ANTHROPIC_API_KEY
#   studio/set_secret.sh HEYGEN_API_KEY
# Prompts for the value with hidden input, replaces any existing line for that name, keeps mode 600.
set -euo pipefail
NAME="${1:-}"
[ -n "$NAME" ] || { echo "usage: $0 VARIABLE_NAME"; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/work/.secrets/studio.env"
mkdir -p "$(dirname "$FILE")"; touch "$FILE"; chmod 600 "$FILE"
printf 'Paste the value for %s (input is hidden), then press Enter: ' "$NAME"
IFS= read -rs VALUE; echo
VALUE="$(printf '%s' "$VALUE" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'"'"']//' -e 's/["'"'"']$//')"
[ -n "$VALUE" ] || { echo "Nothing entered; nothing changed."; exit 1; }
TMP="$(mktemp)"; grep -v "^${NAME}=" "$FILE" > "$TMP" || true
printf '%s=%s\n' "$NAME" "$VALUE" >> "$TMP"
cat "$TMP" > "$FILE"; rm -f "$TMP"; chmod 600 "$FILE"
echo "Saved $NAME (${#VALUE} characters) to work/.secrets/studio.env"
