// Renders the PWA icons from one SVG motif with Playwright's Chromium.
//   node tools/make-icons.mjs   (dev-only: needs playwright + Chromium; set PLAYWRIGHT=/path/to/playwright/index.mjs if it is not installed locally)
// The PNGs are committed, so a normal build never needs this.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const out = path.join(fileURLToPath(new URL('../', import.meta.url)), 'icons');
mkdirSync(out, { recursive: true });

// A 3x3 matrix of element colours with the centre cell lit.
const COLORS = ['#ff7a3d', '#9fe0ff', '#8fb8ff', '#7fdc6a', '#7fd6ff', '#b48cff', '#ffe39a', '#ff3a55', '#7ff0ff'];
function motif(scale) {
  const cell = 40, gap = 14, size = cell * 3 + gap * 2;
  const cells = COLORS.map((c, i) => {
    const x = (i % 3) * (cell + gap), y = Math.floor(i / 3) * (cell + gap);
    const lit = i === 4;
    return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="11" fill="${c}" fill-opacity="${lit ? 1 : 0.62}"${lit ? ' filter="url(#glow)"' : ''}/>`;
  }).join('');
  const s = (scale * 512) / size;
  const o = (512 - size * s) / 2;
  return `<g transform="translate(${o} ${o}) scale(${s})">${cells}</g>`;
}
const svg = (scale, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
<radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#1b2133"/><stop offset="1" stop-color="#0b0d14"/></radialGradient>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="512" height="512"${rounded ? ' rx="112"' : ''} fill="url(#bg)"/>${motif(scale)}</svg>`;

// "any" icons keep a little breathing room; maskable ones stay inside the 80% safe zone.
const variants = {
  'icon-192.png': { size: 192, svg: svg(0.62, true), transparent: true },
  'icon-512.png': { size: 512, svg: svg(0.62, true), transparent: true },
  'icon-maskable-512.png': { size: 512, svg: svg(0.5, false) },
  'apple-touch-icon.png': { size: 180, svg: svg(0.58, false) },
  'favicon-32.png': { size: 32, svg: svg(0.7, true), transparent: true },
};
writeFileSync(path.join(out, 'icon.svg'), svg(0.62, true));

const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
for (const [name, v] of Object.entries(variants)) {
  const page = await browser.newPage({ viewport: { width: v.size, height: v.size } });
  await page.setContent(`<body style="margin:0;background:transparent">${v.svg.replace('width="512" height="512"', `width="${v.size}" height="${v.size}"`)}</body>`);
  writeFileSync(path.join(out, name), await page.screenshot({ omitBackground: !!v.transparent }));
  await page.close();
  console.log('wrote', name);
}
await browser.close();
