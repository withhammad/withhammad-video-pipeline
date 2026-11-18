#!/usr/bin/env python3
"""Numbers + timed replay log for the Fable side, read from a Claude Code (sub)agent transcript.

  transcript_stats.py <transcript.jsonl> --task landing --out results/fable-landing.json --cast logs/fable-landing.cast.jsonl

Usage is summed once per API message id (a message's content blocks repeat the same usage).
Cost uses Anthropic's list price for Fable 5.2: $8 in / $40 out per MTok, cache read 0.1x,
cache write 1.25x (5-minute) - same formula as view.py, so both sides are comparable.
"""
import argparse, json
from datetime import datetime

PR = dict(inp=8.0, out=40.0, cache_read=0.8, cache_write=10.0)


def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('transcript')
    ap.add_argument('--task', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--cast', required=True)
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(a.transcript) if l.strip()]
    rows = [r for r in rows if r.get('timestamp')]
    t0 = ts(rows[0]['timestamp'])
    t_end = ts(rows[-1]['timestamp'])
    usage_by_id, cast, files, turns = {}, [], set(), 0
    for r in rows:
        m = r.get('message') or {}
        if r.get('type') != 'assistant':
            continue
        if m.get('id') and m.get('usage'):
            usage_by_id[m['id']] = m['usage']
        t = round(ts(r['timestamp']) - t0, 2)
        for c in m.get('content') or []:
            if c.get('type') == 'text' and c.get('text', '').strip():
                cast.append({'t': t, 'kind': 'text', 'text': c['text'].strip()})
            elif c.get('type') == 'tool_use':
                i = c.get('input') or {}
                fp = i.get('file_path') or i.get('path') or ''
                if fp:
                    files.add(fp.split('/')[-1])
                size = len(i.get('content') or i.get('new_string') or '')
                cast.append({'t': t, 'kind': 'tool', 'tool': c.get('name'), 'file': fp.split('/')[-1],
                             'chars': size, 'text': f"{c.get('name')} {fp.split('/')[-1] or i.get('command', '')}"})
    u = dict(inp=0, out=0, cache_read=0, cache_write=0)
    for x in usage_by_id.values():
        u['inp'] += x.get('input_tokens', 0)
        u['out'] += x.get('output_tokens', 0)
        u['cache_read'] += x.get('cache_read_input_tokens', 0)
        u['cache_write'] += x.get('cache_creation_input_tokens', 0)
    turns = len(usage_by_id)
    cost = sum(u[k] * PR[k] for k in PR) / 1e6
    res = dict(side='fable', task=a.task, runtime_s=round(t_end - t0, 1),
               tokens_in=u['inp'] + u['cache_read'] + u['cache_write'], tokens_out=u['out'], usage=u,
               cost_usd_list=round(cost, 4), turns=turns, files=sorted(files),
               method='Claude Code subagent on Fable 5.2 (claude-fable-5-2); cost = tokens x Anthropic list price')
    json.dump(res, open(a.out, 'w'), indent=2)
    with open(a.cast, 'w') as f:
        for c in cast:
            f.write(json.dumps(c) + '\n')
    print(json.dumps(res, indent=2))


if __name__ == '__main__':
    main()
