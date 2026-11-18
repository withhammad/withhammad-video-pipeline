// Real browser recording of one model's output (Playwright video), same script for both sides.
//   NODE_PATH=$(npm root -g) node tools/arena/capture_output.mjs <task> <file.html> <out.webm>
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium} = createRequire((process.env.NODE_PATH || '.') + '/')('playwright');

const [task, file, out] = process.argv.slice(2);
const size = task === 'carousel' ? {width: 1080, height: 1350} : {width: 1080, height: 1200};
const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.rec-'));
const browser = await chromium.launch();
const ctx = await browser.newContext({viewport: size, recordVideo: {dir: tmp, size}});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + path.resolve(file));
await page.waitForTimeout(1500);
const sleep = ms => page.waitForTimeout(ms);

if (task === 'landing') {
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = 240;
  for (let i = 1; i <= steps; i++) { await page.evaluate(y => scrollTo(0, y), H * i / steps); await sleep(45); }
  const faq = page.locator('summary:visible, [id*=faq i] [aria-expanded]:visible, [class*=faq i] button:visible').first();
  try {
    if (await faq.count()) { await faq.scrollIntoViewIfNeeded({timeout: 3000}); await faq.click({timeout: 3000}); await sleep(1200); }
  } catch { /* no clickable FAQ: keep the scroll recording */ }
  await sleep(800);
} else if (task === 'carousel') {
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let s = 0; s < 7; s++) {
    const target = Math.min(H, s * 1390);
    await page.evaluate(y => scrollTo({top: y, behavior: 'smooth'}), target);
    await sleep(1700);
  }
} else if (task === 'game') {
  await page.mouse.click(size.width / 2, size.height / 2);
  for (const k of ['Space', 'Enter']) { await page.keyboard.press(k); await sleep(300); }
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < 18000) {
    const k = keys[(i++ * 7 + 3) % 4];
    await page.keyboard.down(k); await sleep(250 + (i * 137) % 400); await page.keyboard.up(k);
    if (i % 9 === 0) { await page.keyboard.press('Space'); await page.keyboard.press('Enter'); }
  }
  await sleep(1000);
}
await ctx.close();
await browser.close();
const vid = fs.readdirSync(tmp).find(f => f.endsWith('.webm'));
fs.renameSync(path.join(tmp, vid), out);
fs.rmSync(tmp, {recursive: true, force: true});
console.log(JSON.stringify({out, errors: errors.slice(0, 5)}));
