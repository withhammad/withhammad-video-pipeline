// Shared runtime for the motion tiles. Each tile draws one moment from the time t alone, inside a 6 s loop, so the
// loop has no seam. Opened in a browser it plays live; a capture tool calls window.__seek(seconds) and gets that
// exact frame (capture.mjs). Classic script on purpose: the tiles must open by double-click (file://), where module
// imports are blocked.
(function () {
  const LOOP = 6;
  const W = 560, H = 500; // design size of every tile (the poster cell is 224x200, the same 1.12 aspect)

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  // progress of t through [a, b], clamped to 0..1
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  // Stripe's main curve cubic-bezier(.25,1,.5,1) is a quartic ease-out; inOut for loops that go and come back
  const ease = {
    out: (x) => 1 - Math.pow(1 - clamp(x), 4),
    inOut: (x) => { x = clamp(x); return x < .5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2; },
    sine: (x) => .5 - Math.cos(Math.PI * clamp(x)) / 2,
    back: (x) => { x = clamp(x); const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  };
  // goes 0 -> 1 over [a, b] and back 1 -> 0 over [c, d]
  const hold = (t, a, b, c, d, f = ease.inOut) => f(seg(t, a, b)) * (1 - f(seg(t, c, d)));
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (h1, h2, k) => { const a = hex(h1), b = hex(h2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`; };
  // colour along the loud gradient: yellow, orange, magenta, violet, brand purple
  const LOUD = ['#ffd601', '#ff6118', '#f44bcc', '#7232f1', '#533afd'];
  const loud = (k) => { k = clamp(k) * (LOUD.length - 1); const i = Math.min(LOUD.length - 2, Math.floor(k)); return mix(LOUD[i], LOUD[i + 1], k - i); };
  // seeded random, so particles and confetti are the same on every frame and every run
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };

  let scale = 1;
  function fit(stage) {
    scale = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`;
  }
  // a canvas in design units, backed by enough device pixels for the current scale
  function canvas(stage, w = W, h = H) {
    const cv = document.createElement('canvas');
    cv.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px`;
    stage.appendChild(cv);
    const ctx = cv.getContext('2d');
    const size = () => {
      const k = scale * (window.devicePixelRatio || 1);
      cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      ctx.setTransform(k, 0, 0, k, 0, 0);
    };
    size();
    addEventListener('resize', size);
    return { cv, ctx, w, h };
  }

  function run(draw) {
    const stage = document.querySelector('.stage');
    fit(stage);
    addEventListener('resize', () => { fit(stage); draw(last); });
    let seeking = false, last = 0;
    const frame = (t) => { last = ((t % LOOP) + LOOP) % LOOP; draw(last); };
    window.__seek = (t) => { seeking = true; frame(t); };
    window.__ready = document.fonts.ready;
    const tick = (now) => { if (seeking) return; frame(now / 1000); requestAnimationFrame(tick); };
    document.fonts.ready.then(() => requestAnimationFrame(tick));
  }

  window.Motion = { LOOP, W, H, clamp, lerp, seg, ease, hold, mix, loud, rng, canvas, run };
})();
