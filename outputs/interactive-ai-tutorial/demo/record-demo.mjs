#!/usr/bin/env node
// Screen recorder for reels: drives a throwaway headless Chrome over the DevTools protocol and records
// what it shows (Page.startScreencast), then builds a constant-frame-rate MP4 with ffmpeg.
// Never touches the owner's own Chrome, tabs or screen: fresh profile, logged out, headless.
//
//   node record.mjs plan.json            plan = {url, out, width?, height?, scale?, fps?, cursor?, actions:[...]}
//
// Actions (run in order):
//   {"wait": ms}
//   {"scroll": {"to": px | "selector", "ms": 2000, "offset": -120}}   smooth eased scroll of the page
//   {"scrollBy": {"y": px, "ms": 1500}}
//   {"move": {"selector": "css", "ms": 600}}                       visible cursor glides to an element
//   {"click": {"selector": "css", "navigate": false}}              cursor ripple; real click when navigate=true
//   {"type": {"selector": "css", "text": "...", "cps": 14}}        types into an input, char by char
//   {"highlight": {"selector": "css", "ms": 1200}}                 soft yellow box around an element
//   {"remove": ["css", ...]}                                       hide banners/popups before recording
//   {"goto": "https://..."}                                        navigate mid-recording
//   {"zoom": {"scale": 1.25, "originSelector": "css", "ms": 900}}  CSS zoom toward an element (1 = reset)
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const CHROME = process.env.STUDIO_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const planPath = process.argv[2];
if (!planPath) { console.error('usage: node record.mjs plan.json'); process.exit(2); }
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const W = plan.width || 1080, H = plan.height || 1350, SCALE = plan.scale || 1, FPS = plan.fps || 25;
const OUT = resolve(dirname(resolve(planPath)), plan.out || 'screen.mp4');
const HARD_TIMEOUT_MS = plan.timeoutMs || 180000;

const work = mkdtempSync(join(tmpdir(), 'screenrec-'));
const frameDir = join(work, 'frames'); mkdirSync(frameDir);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--disable-notifications',
  `--user-data-dir=${join(work, 'profile')}`, '--remote-debugging-port=0', `--window-size=${W},${H}`,
  'about:blank',
], { stdio: 'ignore' });
const killAll = () => { try { chrome.kill('SIGKILL'); } catch {} };
const guard = setTimeout(() => { console.error('screenrec: hard timeout'); killAll(); process.exit(3); }, HARD_TIMEOUT_MS);

async function devtoolsPort() {
  const file = join(work, 'profile', 'DevToolsActivePort');
  for (let i = 0; i < 200; i++) { if (existsSync(file)) return readFileSync(file, 'utf8').split('\n')[0].trim(); await sleep(50); }
  throw new Error('Chrome did not start (no DevToolsActivePort)');
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else if (m.method) (this.handlers.get(m.method) || []).forEach((h) => h(m.params)); }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
  on(method, h) { this.handlers.set(method, [...(this.handlers.get(method) || []), h]); }
  once(method, ms = 30000) { return new Promise((res) => { const t = setTimeout(() => res(null), ms);
    this.on(method, (p) => { clearTimeout(t); res(p); }); }); }
}

const HELPERS = `
(() => { if (window.__rec) return;
  const ease = (t) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const cur = document.createElement('div');
  cur.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(cur.style, {position:'fixed', left:'0px', top:'0px', zIndex:2147483647, pointerEvents:'none', transform:'translate(-4px,-2px)', filter:'drop-shadow(0 2px 3px rgba(0,0,0,.35))', display:${JSON.stringify(plan.cursor === false ? 'none' : 'block')}});
  const pos = {x: innerWidth * .62, y: innerHeight * .55};
  const place = () => { cur.style.left = pos.x + 'px'; cur.style.top = pos.y + 'px'; };
  const mount = () => { document.documentElement.appendChild(cur); place(); };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  const anim = (ms, step) => new Promise((done) => { const t0 = performance.now();
    const f = (now) => { const k = Math.min(1, (now - t0) / ms); step(ease(k)); k < 1 ? requestAnimationFrame(f) : done(); };
    requestAnimationFrame(f); });
  // 'text=31.8k stars' picks the smallest visible element whose text contains it (class names change; text rarely does).
  const find = (sel) => { if (!sel.startsWith('text=')) return document.querySelector(sel);
    const want = sel.slice(5).trim().toLowerCase(); let best = null, area = Infinity;
    for (const e of document.body.querySelectorAll('*')) { const r = e.getBoundingClientRect();
      if (!r.width || !r.height || !(e.textContent || '').toLowerCase().includes(want)) continue;
      if (r.width * r.height < area) { best = e; area = r.width * r.height; } }
    return best; };
  const el = (sel) => { const e = find(sel); if (!e) throw new Error('selector not found: ' + sel); return e; };
  window.__rec = {
    scrollTo: (y, ms) => { const y0 = scrollY; return anim(ms, (k) => scrollTo(0, y0 + (y - y0) * k)); },
    scrollToSel: (sel, ms, off) => { const r = el(sel).getBoundingClientRect(); return window.__rec.scrollTo(scrollY + r.top + (off || -120), ms); },
    move: (sel, ms) => { const r = el(sel).getBoundingClientRect(); const x0 = pos.x, y0 = pos.y;
      const x1 = r.left + Math.min(r.width * .5, 60), y1 = r.top + r.height * .5;
      return anim(ms, (k) => { pos.x = x0 + (x1 - x0) * k; pos.y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 30; place(); }); },
    ripple: () => { const d = document.createElement('div');
      Object.assign(d.style, {position:'fixed', left:(pos.x-18)+'px', top:(pos.y-18)+'px', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,214,10,.55)', zIndex:2147483646, pointerEvents:'none', transition:'transform .45s ease-out, opacity .45s ease-out'});
      document.documentElement.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'scale(2.2)'; d.style.opacity = '0'; });
      return new Promise((r) => setTimeout(() => { d.remove(); r(); }, 480)); },
    highlight: (sel, ms) => { const r = el(sel).getBoundingClientRect(); const b = document.createElement('div');
      Object.assign(b.style, {position:'absolute', left:(r.left+scrollX-8)+'px', top:(r.top+scrollY-6)+'px', width:(r.width+16)+'px', height:(r.height+12)+'px', borderRadius:'10px', background:'rgba(255,214,10,.28)', outline:'3px solid #FFD60A', zIndex:2147483645, pointerEvents:'none', opacity:'0', transition:'opacity .25s'});
      document.body.appendChild(b); requestAnimationFrame(() => b.style.opacity = '1');
      return new Promise((r) => setTimeout(() => { b.style.opacity = '0'; setTimeout(() => { b.remove(); r(); }, 260); }, ms)); },
    type: async (sel, text, cps) => { const e = el(sel); e.focus();
      for (const ch of text) { e.value += ch; e.dispatchEvent(new Event('input', {bubbles:true})); await new Promise((r) => setTimeout(r, 1000 / cps)); } },
    zoom: (scale, sel, ms) => { const root = document.documentElement; const from = parseFloat(root.dataset.recZoom || '1');
      if (sel) { const r = el(sel).getBoundingClientRect(); root.style.transformOrigin = (r.left + r.width/2) + 'px ' + (r.top + scrollY + r.height/2) + 'px'; }
      root.dataset.recZoom = String(scale);
      return anim(ms, (k) => { root.style.transform = 'scale(' + (from + (scale - from) * k) + ')'; }); },
    remove: (sels) => sels.forEach((s) => document.querySelectorAll(s).forEach((e) => e.remove())),
    waitFor: async (sel, ms) => { const t0 = performance.now();
      while (!find(sel)) { if (performance.now() - t0 > ms) throw new Error('selector not found after ' + ms + ' ms: ' + sel);
        await new Promise((r) => setTimeout(r, 100)); } },
  };
})();`;

async function run() {
  const port = await devtoolsPort();
  const created = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(created.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  if(plan.downloadDir){mkdirSync(plan.downloadDir,{recursive:true});await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:plan.downloadDir});}
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: HELPERS });
  // Headless Chrome announces itself as HeadlessChrome; some sites then serve a different page.
  const ua = (await cdp.send('Browser.getVersion')).userAgent.replace('HeadlessChrome', 'Chrome');
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: ua, acceptLanguage: 'en-US,en' });
  const evalJs = async (expr) => { const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
  const navigate = async (url) => { const loaded = cdp.once('Page.loadEventFired', 45000); await cdp.send('Page.navigate', { url });
    await loaded; await sleep(plan.settleMs ?? 1500); await evalJs(HELPERS); };

  await navigate(plan.url);
  if (plan.setup) await evalJs(plan.setup);
  if (plan.assertions) for (const expr of plan.assertions) { if (!await evalJs(expr)) throw new Error('Verification failed: '+expr); }
  if (plan.remove) await evalJs(`__rec.remove(${JSON.stringify(plan.remove)})`);
  if (plan.debug) {   // what the recorder actually sees: title, URL, a PNG, and whether each selector matches
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(OUT.replace(/\.mp4$/, '') + '.debug.png', Buffer.from(shot.data, 'base64'));
    const sels = [...new Set((plan.actions || []).flatMap((a) => [a.move?.selector, a.click?.selector, a.type?.selector,
      a.highlight?.selector, a.zoom?.originSelector, typeof a.scroll?.to === 'string' ? a.scroll.to : null]).filter(Boolean))];
    console.error(JSON.stringify(await evalJs(`({title: document.title, url: location.href, selectors: Object.fromEntries(${JSON.stringify(sels)}.map((s) => [s, s.startsWith('text=') ? 'text' : document.querySelectorAll(s).length]))})`)));
  }

  const frames = [];
  cdp.on('Page.screencastFrame', (p) => {
    const file = join(frameDir, `f${String(frames.length).padStart(6, '0')}.jpg`);
    writeFileSync(file, Buffer.from(p.data, 'base64'));
    frames.push({ file, t: p.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * SCALE, maxHeight: H * SCALE, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;

  const selOf = (a) => a.move?.selector || a.click?.selector || a.type?.selector || a.highlight?.selector
    || a.zoom?.originSelector || (typeof a.scroll?.to === 'string' ? a.scroll.to : null);
  for (const a of plan.actions || []) {
    const sel = selOf(a); if (sel) await evalJs(`__rec.waitFor(${JSON.stringify(sel)}, ${plan.selectorTimeoutMs || 6000})`);
    if (a.at !== undefined) { const remaining=a.at*1000-(Date.now()/1000-t0)*1000; if(remaining>0) await sleep(remaining); }
    if(a.pdf){const pdf=await cdp.send('Page.printToPDF',{printBackground:true,landscape:true,preferCSSPageSize:true});writeFileSync(a.pdf,Buffer.from(pdf.data,'base64'));}
    else if (a.eval) { await evalJs(a.eval); await sleep(200); }
    else if (a.set) { await evalJs(`document.querySelector(${JSON.stringify(a.set.selector)}).scrollIntoView({block:'nearest'})`); await evalJs(`__rec.move(${JSON.stringify(a.set.selector)},400)`); await evalJs(`(() => {const e=document.querySelector(${JSON.stringify(a.set.selector)});e.value=${JSON.stringify(a.set.value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`); await sleep(a.set.ms || 800); }
    else if (a.activate) { await evalJs(`document.querySelector(${JSON.stringify(a.activate)}).scrollIntoView({block:'center'})`); await evalJs(`__rec.move(${JSON.stringify(a.activate)},500)`); await evalJs('__rec.ripple()'); await evalJs(`document.querySelector(${JSON.stringify(a.activate)}).click()`); await sleep(800); }
    else if ('wait' in a) await sleep(a.wait);
    else if (a.scroll) await evalJs(typeof a.scroll.to === 'string'
      ? `__rec.scrollToSel(${JSON.stringify(a.scroll.to)}, ${a.scroll.ms || 2000}, ${a.scroll.offset ?? -120})`
      : `__rec.scrollTo(${Number(a.scroll.to)}, ${a.scroll.ms || 2000})`);
    else if (a.scrollBy) await evalJs(`__rec.scrollTo(scrollY + ${Number(a.scrollBy.y)}, ${a.scrollBy.ms || 1500})`);
    else if (a.move) await evalJs(`__rec.move(${JSON.stringify(a.move.selector)}, ${a.move.ms || 600})`);
    else if (a.click) { await evalJs(`__rec.ripple()`);
      if (a.click.navigate) { const loaded = cdp.once('Page.loadEventFired', 45000);
        await evalJs(`document.querySelector(${JSON.stringify(a.click.selector)}).click()`); await loaded; await sleep(800); await evalJs(HELPERS); } }
    else if (a.type) await evalJs(`__rec.type(${JSON.stringify(a.type.selector)}, ${JSON.stringify(a.type.text)}, ${a.type.cps || 14})`);
    else if (a.highlight) await evalJs(`__rec.highlight(${JSON.stringify(a.highlight.selector)}, ${a.highlight.ms || 1200})`);
    else if (a.remove) await evalJs(`__rec.remove(${JSON.stringify(a.remove)})`);
    else if (a.goto) await navigate(a.goto);
    else if (a.zoom) await evalJs(`__rec.zoom(${Number(a.zoom.scale)}, ${JSON.stringify(a.zoom.originSelector || null)}, ${a.zoom.ms || 900})`);
    else throw new Error('unknown action ' + JSON.stringify(a));
  }
  await sleep(250);
  const lastShot=await cdp.send('Page.captureScreenshot',{format:'png'});writeFileSync(OUT.replace(/\.mp4$/,'.final.png'),Buffer.from(lastShot.data,'base64'));
  await cdp.send('Page.stopScreencast');
  const total = Date.now() / 1000 - t0;
  ws.close(); killAll();
  if (frames.length < 2) throw new Error('no frames captured');

  // Screencast frames arrive only when the page changes: hold each frame until the next one, so the
  // timeline keeps real time, then resample to a constant frame rate.
  const lines = [];
  frames.forEach((f, i) => { const next = i + 1 < frames.length ? frames[i + 1].t : frames[0].t + total;
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`); });
  lines.push(`file '${frames[frames.length - 1].file}'`);
  writeFileSync(join(work, 'list.txt'), lines.join('\n'));
  mkdirSync(dirname(OUT), { recursive: true });
  const ff = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'),
    '-vf', `fps=${FPS},scale=${W * SCALE}:${H * SCALE}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '17', '-preset', 'ultrafast', '-threads', '2',
    '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed');
  console.log(JSON.stringify({ out: OUT, frames: frames.length, seconds: Number(total.toFixed(2)), width: W * SCALE, height: H * SCALE, fps: FPS }));
}

run().then(() => { clearTimeout(guard); rmSync(work, { recursive: true, force: true }); })
  .catch((e) => { clearTimeout(guard); killAll(); console.error('screenrec: ' + e.message); rmSync(work, { recursive: true, force: true }); process.exit(1); });
