#!/usr/bin/env python3
"""Hard spend cap for the GPT-6.2 Astra side: a local proxy between Codex and api.openai.com.

Codex is pointed at http://127.0.0.1:<port>/v1 (custom provider, see run_astra.sh). Every
response's usage is read from the stream and added to a persistent ledger at conservative
list price (cached input counted at the full $8/MTok). Before forwarding a request the proxy
refuses (HTTP 429) once the ledger plus a worst-case single-request reserve would pass the
total cap, or the per-task cap. The API key is read from the environment, never logged.
"""
import argparse, json, os, ssl, sys
import certifi
from pathlib import Path
from aiohttp import web, ClientSession, ClientTimeout, TCPConnector

IN_PRICE, OUT_PRICE = 8.0, 40.0          # $/MTok, conservative: cached input billed at full price
MAX_OUT = 32000                          # injected max_output_tokens bound per request
RESERVE = (200_000 * IN_PRICE + MAX_OUT * OUT_PRICE) / 1e6   # worst single request ~ $2.88
UPSTREAM = 'https://api.openai.com'


def load(p):
    return json.loads(p.read_text()) if p.exists() else {'spent': 0.0, 'requests': []}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8787)
    ap.add_argument('--ledger', required=True)
    ap.add_argument('--task', required=True)
    ap.add_argument('--total-cap', type=float, default=20.0)
    ap.add_argument('--task-cap', type=float, default=6.0)
    a = ap.parse_args()
    ledger = Path(a.ledger)
    key = os.environ.get('OPENAI_API_KEY', '')
    state = {'task_spent': 0.0}

    def refuse(msg):
        print(f'[cap] REFUSED: {msg}', file=sys.stderr, flush=True)
        return web.json_response({'error': {'message': f'spend cap: {msg}', 'type': 'insufficient_quota', 'code': 'spend_cap'}}, status=429)

    async def handle(req: web.Request):
        L = load(ledger)
        body = await req.read()
        if req.method == 'POST':
            if L['spent'] + RESERVE > a.total_cap:
                return refuse(f"total ${L['spent']:.2f} + reserve ${RESERVE:.2f} > ${a.total_cap:.2f}")
            if state['task_spent'] + RESERVE > a.task_cap:
                return refuse(f"task ${state['task_spent']:.2f} + reserve > ${a.task_cap:.2f}")
            try:
                j = json.loads(body)
                j['max_output_tokens'] = min(int(j.get('max_output_tokens') or MAX_OUT), MAX_OUT)
                body = json.dumps(j).encode()
            except Exception:
                pass
        hdr = {k: v for k, v in req.headers.items() if k.lower() not in ('host', 'content-length', 'authorization', 'accept-encoding')}
        hdr['Authorization'] = f'Bearer {key}'
        async with ClientSession(connector=TCPConnector(ssl=ssl.create_default_context(cafile=certifi.where())), timeout=ClientTimeout(total=None, sock_read=600)) as s:
            async with s.request(req.method, UPSTREAM + req.path_qs, data=body or None, headers=hdr) as up:
                resp = web.StreamResponse(status=up.status, headers={k: v for k, v in up.headers.items()
                                          if k.lower() in ('content-type', 'openai-request-id', 'x-request-id')})
                await resp.prepare(req)
                buf, usage = b'', None
                async for chunk in up.content.iter_any():
                    await resp.write(chunk)
                    buf += chunk
                    while b'\n' in buf:
                        line, buf = buf.split(b'\n', 1)
                        if b'"usage"' in line and (b'response.completed' in line or b'response.incomplete' in line or b'response.failed' in line):
                            try:
                                usage = json.loads(line.split(b'data:', 1)[1])['response']['usage']
                            except Exception:
                                pass
                if usage is None and buf.strip().startswith(b'{'):
                    try:
                        usage = json.loads(buf).get('usage')
                    except Exception:
                        pass
                if usage:
                    cost = (usage.get('input_tokens', 0) * IN_PRICE + usage.get('output_tokens', 0) * OUT_PRICE) / 1e6
                    state['task_spent'] += cost
                    L = load(ledger)
                    L['spent'] = round(L['spent'] + cost, 6)
                    L['requests'].append({'task': a.task, 'path': req.path, 'usage': usage, 'cost': round(cost, 6)})
                    ledger.write_text(json.dumps(L, indent=1))
                    print(f"[cap] +${cost:.3f}  task ${state['task_spent']:.2f}  total ${L['spent']:.2f}/{a.total_cap:.0f}", file=sys.stderr, flush=True)
                await resp.write_eof()
                return resp

    app = web.Application(client_max_size=64 * 1024 * 1024)
    app.router.add_route('*', '/{tail:.*}', handle)
    web.run_app(app, host='127.0.0.1', port=a.port, print=None)


if __name__ == '__main__':
    main()
