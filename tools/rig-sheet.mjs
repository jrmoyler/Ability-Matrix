// Dev-only: renders a contact sheet of the pure-element rigs to a PNG.
//   node tools/rig-sheet.mjs out.png [id ...]        (all 80 when no ids)
// Needs `playwright` and its Chromium (PLAYWRIGHT_BROWSERS_PATH).
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { SPELLS } from './pure-spells.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out = 'rig-sheet.png', ...ids] = process.argv.slice(2);
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const manifest = SPELLS.map((s) => ({
  id: s.id, cast: s.cast, archetype: s.archetype,
  module: `/packs/sandbox/src/assets/codex/${s.cls}Geometry.js`,
  hero: `create${s.cls}HeroGeometry`, piece: `create${s.cls}PieceGeometry`
}));
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/tools/rig-manifest.json') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(manifest)); }
  const file = path.join(root, url);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; return res.end('no'); }
  res.setHeader('content-type', types[path.extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;
const cols = Number(process.env.COLS ?? 4);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/tools/rig-sheet.html?cols=${cols}&cell=${process.env.CELL ?? 360}&ids=${ids.join(',')}`);
await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
const canvas = await page.$('canvas');
writeFileSync(out, await canvas.screenshot());
await browser.close();
server.close();
console.log('wrote', out);
