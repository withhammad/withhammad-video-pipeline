#!/usr/bin/env python3
"""Pretty, recordable terminal view of one agent run.

Reads Claude Code `--output-format stream-json` or Codex `exec --json` lines on
stdin, prints a timestamped activity feed, and ends with a scoreboard box
(runtime, tokens, cost). Writes the numbers to --out as JSON.

Cost is computed from tokens at list price so both sides are comparable:
  Fable 5.2 (Anthropic docs): $8 in / $40 out per MTok, cache read 0.1x, cache write 1.25x.
  GPT-6.2 Astra: $8 in / $40 out per MTok (secondary sources); cached input rate
  ASTRA_CACHED_IN is an assumption to verify on openai.com/api/pricing before publishing.
"""
import argparse, json, sys, time

P = {
    'fable': dict(inp=8.0, out=40.0, cache_read=0.8, cache_write=10.0),
    'astra': dict(inp=8.0, out=40.0, cache_read=0.8, cache_write=8.0),  # ASTRA_CACHED_IN = 0.8 (unverified)
}
C = dict(dim='\033[2m', b='\033[1m', r='\033[0m', fable='\033[38;5;209m', astra='\033[38;5;79m',
         y='\033[38;5;221m', g='\033[38;5;114m')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--side', choices=['fable', 'astra'], required=True)
    ap.add_argument('--task', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--cast', help='timed line log (JSONL: t, text) for the video replay')
    a = ap.parse_args()
    col = C[a.side]
    name = 'FABLE 5.2  ·  Claude Code' if a.side == 'fable' else 'GPT-6.2 ASTRA  ·  Codex'
    t0 = time.time()
    castf = open(a.cast, 'w') if a.cast else None
    import builtins; _print = builtins.print

    def print(*x, **k):  # noqa: A001 - echo to screen and to the timed cast
        _print(*x, **k)
        if castf:
            castf.write(json.dumps({'t': round(time.time() - t0, 2), 'text': ' '.join(map(str, x))}) + '\n'); castf.flush()
    print(f"{col}{C['b']}━━ {name} ━━{C['r']}  {C['dim']}task: {a.task}{C['r']}\n", flush=True)
    usage = dict(inp=0, out=0, cache_read=0, cache_write=0)
    reported_cost = None
    files, turns = set(), 0

    def say(icon, text):
        el = time.time() - t0
        text = ' '.join(str(text).split())
        if len(text) > 92:
            text = text[:89] + '...'
        print(f"{C['dim']}[{int(el // 60):02d}:{int(el % 60):02d}]{C['r']} {col}{icon}{C['r']} {text}", flush=True)

    for line in sys.stdin:
        try:
            ev = json.loads(line)
        except Exception:
            continue
        t = ev.get('type')
        # ---- Claude Code stream-json
        if t == 'assistant':
            turns += 1
            for c in ev.get('message', {}).get('content', []):
                if c.get('type') == 'text' and c.get('text', '').strip():
                    say('💬', c['text'])
                elif c.get('type') == 'tool_use':
                    i = c.get('input', {})
                    fp = i.get('file_path') or i.get('path')
                    if fp:
                        files.add(fp.split('/')[-1])
                    say('▸', f"{c.get('name')} {fp or i.get('command') or ''}")
        elif t == 'result':
            u = ev.get('usage', {})
            usage.update(inp=u.get('input_tokens', 0), out=u.get('output_tokens', 0),
                         cache_read=u.get('cache_read_input_tokens', 0), cache_write=u.get('cache_creation_input_tokens', 0))
            reported_cost = ev.get('total_cost_usd')
            turns = ev.get('num_turns', turns)
        # ---- Codex exec --json
        elif t in ('item.started', 'item.completed'):
            it = ev.get('item', {})
            k = it.get('type') or it.get('item_type')
            if t == 'item.completed' and k == 'agent_message':
                say('💬', it.get('text', ''))
            elif t == 'item.started' and k == 'command_execution':
                say('▸', f"run {it.get('command', '')}")
            elif t == 'item.completed' and k == 'file_change':
                for ch in it.get('changes', []):
                    files.add(ch.get('path', '').split('/')[-1])
                    say('▸', f"write {ch.get('path', '').split('/')[-1]}")
            elif t == 'item.completed' and k == 'reasoning':
                say('·', it.get('text', 'thinking'))
        elif t == 'turn.completed':
            turns += 1
            u = ev.get('usage', {})
            cached = u.get('cached_input_tokens', 0)
            usage['inp'] += u.get('input_tokens', 0) - cached
            usage['cache_read'] += cached
            usage['out'] += u.get('output_tokens', 0)
        elif t in ('error', 'turn.failed'):
            say('✖', ev.get('message') or ev.get('error'))

    el = time.time() - t0
    p = P[a.side]
    cost = (usage['inp'] * p['inp'] + usage['out'] * p['out'] + usage['cache_read'] * p['cache_read']
            + usage['cache_write'] * p['cache_write']) / 1e6
    tok_in = usage['inp'] + usage['cache_read'] + usage['cache_write']
    res = dict(side=a.side, task=a.task, runtime_s=round(el, 1), tokens_in=tok_in, tokens_out=usage['out'],
               usage=usage, cost_usd_list=round(cost, 4), cost_usd_reported=reported_cost, turns=turns, files=sorted(files))
    json.dump(res, open(a.out, 'w'), indent=2)
    print(f"\n{col}{C['b']}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓{C['r']}")
    for k, v in [('Runtime', f"{int(el // 60)}m {int(el % 60):02d}s"), ('Tokens in', f"{tok_in:,}"),
                 ('Tokens out', f"{usage['out']:,}"), ('Cost (API list)', f"${cost:.2f}")]:
        print(f"{col}{C['b']}┃{C['r']}  {k:<16}{C['y']}{C['b']}{v:>17}{C['r']}  {col}{C['b']}┃{C['r']}")
    print(f"{col}{C['b']}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛{C['r']}", flush=True)


if __name__ == '__main__':
    main()
