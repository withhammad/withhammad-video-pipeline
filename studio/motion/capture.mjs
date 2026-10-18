#!/usr/bin/env node
// Frame-exact capture of a motion page: serves studio/motion over 127.0.0.1, opens the page in a throwaway headless
// Chrome (fresh profile, never the owner's Chrome), and for every frame calls window.__seek(t), waits two animation
// frames, screenshots, then encodes the PNGs with ffmpeg. Pages draw from t alone (motion.js), so the result is
// smooth at any fps however slow a frame is to render.
//
//   node capture.mjs <page> --out <file.mp4> [--size 1080x1350] [--scale 2] [--fps 25] [--seconds 6]
//                           [--from 0] [--still <file.png> --at 2.5] [--frames-dir <dir>]
// <page> is relative to studio/motion (e.g. claude-motion-graphics/poster.html). --scale renders that many device
// pixels per CSS pixel and the encode scales back to --size (sharper edges and text).
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname, normalize, dirname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.STUDIO_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const page = argv[0];
const opt = (name, fallback) => { const i = argv.indexOf('--' + name); return i > 0 ? argv[i + 1] : fallback; };
if (!page || page.startsWith('--')) { console.error('usage: node capture.mjs <page> --out file.mp4 [options]'); process.exit(2); }
const [W, H] = opt('size', '1080x1350').split('x').map(Number);
const SCALE = Number(opt('scale', '2'));
const FPS = Number(opt('fps', '25'));
const SECONDS = Number(opt('seconds', '6'));
const FROM = Number(opt('from', '0'));
const OUT = opt('out') && resolve(opt('out'));
const STILL = opt('still') && resolve(opt('still'));
const AT = Number(opt('at', '0'));
if (!OUT && !STILL) { console.error('give --out and/or --still'); process.exit(2); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = resolve(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const work = mkdtempSync(join(tmpdir(), 'motioncap-'));
const frames = opt('frames-dir') ? resolve(opt('frames-dir')) : join(work, 'frames');
mkdirSync(frames, { recursive: true });
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--force-color-profile=srgb',
  `--user-data-dir=${join(work, 'profile')}`, '--remote-debugging-port=0', `--window-size=${W},${H}`, 'about:blank'],
{ stdio: 'ignore' });
const exited = new Promise((r) => chrome.once('exit', r));
// Chrome keeps writing to its profile while it shuts down: wait for it before the profile folder is deleted
const cleanup = async () => { try { chrome.kill('SIGKILL'); } catch {} server.close();
  await Promise.race([exited, sleep(5000)]); };
const guard = setTimeout(() => { console.error('capture: hard timeout'); cleanup(); process.exit(3); }, 30 * 60 * 1000);

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result); } }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
}

try {
  const portFile = join(work, 'profile', 'DevToolsActivePort');
  for (let i = 0; i < 200 && !existsSync(portFile); i++) await sleep(50);
  const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const cdp = new CDP(ws);
  const evalJs = async (expression) => {
    const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result?.value;
  };
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  await cdp.send('Page.navigate', { url: base + page });
  // the page is ready when its fonts are in and every iframe (tiles inside a poster or reel) exposes __seek
  for (let i = 0; ; i++) {
    const ok = await evalJs(`(async () => { if (document.readyState !== 'complete' || !window.__seek) return false;
      await document.fonts.ready; if (window.__ready) await window.__ready;
      for (const f of document.querySelectorAll('iframe')) { const w = f.contentWindow;
        if (!w || !w.__seek || w.document.readyState !== 'complete') return false; await w.document.fonts.ready; }
      return true; })()`).catch(() => false);
    if (ok) break;
    if (i > 300) throw new Error('page never became ready: ' + page);
    await sleep(100);
  }
  const seekAndShoot = async (t, file) => {
    await evalJs(`(async () => { await window.__seek(${t});
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); })()`);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
  };
  if (STILL) {
    const raw = join(work, 'still.png');
    await seekAndShoot(AT, raw);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-vf', `scale=${W}:${H}:flags=lanczos`, STILL]);
    if (r.status) throw new Error('ffmpeg still failed: ' + r.stderr);
    console.log('still ' + STILL);
  }
  if (OUT) {
    const total = Math.round(SECONDS * FPS);
    const t0 = Date.now();
    for (let i = 0; i < total; i++) {
      await seekAndShoot(FROM + i / FPS, join(frames, String(i).padStart(5, '0') + '.png'));
      if (i % 50 === 49) console.log(`frame ${i + 1}/${total} (${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame)`);
    }
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, '%05d.png'),
      '-vf', `scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', OUT]);
    if (r.status) throw new Error('ffmpeg encode failed: ' + r.stderr);
    console.log(`video ${OUT} (${total} frames, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
} finally {
  clearTimeout(guard);
  await cleanup();
  rmSync(opt('frames-dir') ? join(work, 'profile') : work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
