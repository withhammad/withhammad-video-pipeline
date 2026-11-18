#!/bin/bash
# Run one side of the head-to-head on one task in its own git worktree.
#   tools/arena/run_side.sh fable landing
#   tools/arena/run_side.sh astra landing     (needs OPENAI_API_KEY in work/.secrets/studio.env; $20 total cap)
set -uo pipefail
SIDE=$1; TASK=$2
REPO=$(cd "$(dirname "$0")/../.." && pwd)
# Outside $HOME so no personal CLAUDE.md/AGENTS.md is discovered above the worktree.
ARENA=${ARENA:-/Users/Shared/astra-fable-arena}
PY=$REPO/studio/.venv/bin/python
PROMPT=$($PY -c "import json,sys;print(next(t['prompt'] for t in json.load(open('$REPO/tools/arena/tasks.json'))['tasks'] if t['id']=='$TASK'))")
mkdir -p "$ARENA/results" "$ARENA/logs"
if [ ! -d "$ARENA/base/.git" ]; then
  git init -q "$ARENA/base" && git -C "$ARENA/base" commit -q --allow-empty -m "empty start"
fi
WT=$ARENA/wt/$SIDE-$TASK
[ -d "$WT" ] && git -C "$ARENA/base" worktree remove --force "$WT"
git -C "$ARENA/base" worktree add -q --detach "$WT" HEAD
cd "$WT"
[ -t 1 ] && clear
if [ "$SIDE" = fable ]; then
  claude -p "$PROMPT" --model claude-fable-5-2 --output-format stream-json --verbose \
    --permission-mode acceptEdits --allowedTools "Read,Write,Edit" \
    --setting-sources project --strict-mcp-config --disable-slash-commands --no-session-persistence 2>"$ARENA/logs/$SIDE-$TASK.err" \
    | tee "$ARENA/logs/$SIDE-$TASK.jsonl" | $PY "$REPO/tools/arena/view.py" --side fable --task "$TASK" --out "$ARENA/results/$SIDE-$TASK.json" --cast "$ARENA/logs/$SIDE-$TASK.cast.jsonl"
else
  KEY=$(grep -E '^OPENAI_API_KEY=' "$REPO/work/.secrets/studio.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'")
  [ -z "$KEY" ] && { echo "No OPENAI_API_KEY in work/.secrets/studio.env - Astra side not run."; exit 3; }
  export OPENAI_API_KEY=$KEY CODEX_HOME=$ARENA/codex-home
  mkdir -p "$CODEX_HOME"
  cat > "$CODEX_HOME/config.toml" <<'EOF'
[model_providers.arena]
name = "OpenAI via local spend-cap proxy"
base_url = "http://127.0.0.1:8787/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
EOF
  $PY "$REPO/tools/arena/cap_proxy.py" --ledger "$ARENA/astra_ledger.json" --task "$TASK" \
    --total-cap 20 --task-cap 6 2>>"$ARENA/logs/proxy.log" &
  PROXY=$!; sleep 2
  codex exec --json -m gpt-6.2-astra -c model_provider=arena --skip-git-repo-check -s workspace-write -C "$WT" "$PROMPT" \
    2>"$ARENA/logs/$SIDE-$TASK.err" | tee "$ARENA/logs/$SIDE-$TASK.jsonl" \
    | $PY "$REPO/tools/arena/view.py" --side astra --task "$TASK" --out "$ARENA/results/$SIDE-$TASK.json" --cast "$ARENA/logs/$SIDE-$TASK.cast.jsonl"
  kill $PROXY 2>/dev/null
fi
touch "$ARENA/logs/$SIDE-$TASK.done"
