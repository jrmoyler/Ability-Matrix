// Render any castable in the real sandbox and save frames you can look at.
//
//   node tools/capture-cast.mjs <out-dir> <uid> [uid ...] [--frames=8,20,40,70] [--sheet]
//                               [--distance=8] [--targets=cluster|ring|none]
//
// Each uid is cast once from the caster toward the dummies under a fixed 30 Hz
// clock (software WebGL), and a PNG is written for every listed frame:
// `<out-dir>/<pack>__<id>-f<frame>.png`. `--sheet` also writes one contact
// sheet per uid (`<pack>__<id>-sheet.jpg`) with the frames side by side, which
// is the quickest way for a reviewer — human or agent — to read a whole cast.
// By default seven dummies stand in a cluster where the cast lands, so hits
// and body reactions are in the frames (`--targets=ring` keeps the play ring).
//
// Use it to compare a cast with the reference bar (docs/castable-quality-standard.md
// lists the reference uids), e.g.
//   node tools/capture-cast.mjs /tmp/cap linear/meteor codex/basalt --sheet
//
// A Matrix Expansion cast that is not registered yet (still being written) can
// be loaded on its own, so a half-written sibling never breaks your capture:
//   node tools/capture-cast.mjs /tmp/cap matrix-expansion/combustion-debt \
//     --module=abilities/expansion-2026/combustion-debt/index.js --sheet
// The module path is relative to packs/sandbox/src and must export `config`
// (id, meta.element), `ID`, `Ability` and `buildEditor` like batch-c casts.
//
// Frames are evidence for a human or an image-reading agent; they do not by
// themselves certify quality.
import { createServer } from '../packs/sandbox/node_modules/vite/dist/node/index.js';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Playwright is not a project dependency: use a local install if there is one,
// otherwise the machine's global one (require honours NODE_PATH, import does not).
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const [outDir, ...uids] = args.filter((a) => !a.startsWith('--'));
if (!outDir || !uids.length) {
  console.error('usage: node tools/capture-cast.mjs <out-dir> <uid> [uid ...] [--frames=8,20,40,70] [--sheet] [--distance=8] [--port=5190]');
  process.exit(2);
}
const frames = String(flags.frames ?? '8,20,40,70').split(',').map(Number).filter((n) => n > 0).sort((a, b) => a - b);
const port = Number(flags.port ?? 5190 + Math.floor(Math.random() * 400));
mkdirSync(outDir, { recursive: true });

// Software WebGL is CPU-bound: several builders capturing at once thrash the
// machine until page loads time out. Take one of CAPTURE_SLOTS machine-wide
// slots (a directory lock; stale after 40 min) and queue for it.
const SLOTS = Number(process.env.CAPTURE_SLOTS ?? 2);
const LOCK_ROOT = join(tmpdir(), 'capture-cast-slots');
mkdirSync(LOCK_ROOT, { recursive: true });
let slot = null;
for (let waited = 0; slot === null; waited++) {
  for (let i = 0; i < SLOTS && slot === null; i++) {
    const dir = join(LOCK_ROOT, `slot-${i}`);
    try {
      mkdirSync(dir);
      slot = dir;
    } catch {
      try { if (Date.now() - statSync(dir).mtimeMs > 40 * 60 * 1000) rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  }
  if (slot === null) {
    if (waited % 12 === 0) console.error(`capture-cast: waiting for a capture slot (${SLOTS} busy)…`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}
const releaseSlot = () => { try { rmSync(slot, { recursive: true, force: true }); } catch {} };
process.on('exit', releaseSlot);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { releaseSlot(); process.exit(130); });

const report = { uids, frames, captures: [], errors: [] };
let server, browser;
try {
  server = await createServer({
    root: resolve('packs/sandbox'),
    // A private dependency cache: several captures may run at once.
    cacheDir: mkdtempSync(join(tmpdir(), 'capture-vite-')),
    server: { host: '127.0.0.1', port, strictPort: false, hmr: false, watch: { ignored: ['**/*'] } },
    logLevel: 'error'
  });
  await server.listen();
  const url = server.resolvedUrls?.local?.[0] ?? `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.75 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });
  await page.goto(`${url}?hud=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.matrix && window.app && window.app.character?.root, null, { timeout: 180000 });
  // Frame tighter than play (11.5 m) so the cast fills the shot; --distance overrides.
  await page.evaluate(async (distance) => {
    const { settings } = await import('/src/config/settings.js');
    settings.camera.distance = distance;
    settings.camera.zoomDamping = 1e-9;
    app.stop();
    app.time.tick = () => 1 / 30;
    app.environment.sun.shadow.mapSize.set(1024, 1024);
    app.environment.sun.shadow.map?.dispose();
    app.environment.sun.shadow.map = null;
  }, Number(flags.distance ?? 8));
  if (flags.module) {
    // Install one unregistered expansion module next to the live roster.
    await page.evaluate(async ({ path, uid }) => {
      const m = await import(`/src/${path}`);
      const config = m.config ?? m.CONFIG;
      const Ability = m.Ability ?? m[Object.keys(m).find((k) => k.endsWith('Ability'))];
      const { installProductionExpansion } = await import('/src/abilities/expansion-2026/ProductionRegistration.js');
      const live = app.expansionLive;
      delete app.expansionLive;
      const handle = installProductionExpansion(app, [{ uid, ID: m.ID ?? config.id, config, Ability, buildEditor: m.buildEditor, status: 'live' }]);
      if (live) {
        for (const [k, v] of handle.byUid) live.byUid.set(k, v);
        for (const [k, v] of handle.byId) live.byId.set(k, v);
        app.expansionLive = live;
      }
    }, { path: String(flags.module).replace(/^\/+/, ''), uid: uids[0] });
  }
  // Step the simulation without paying for a render per frame, then render once.
  const tick = (n) => page.evaluate((n) => {
    const render = app.post.render, shadow = app.contactShadows.render;
    try { app.post.render = () => {}; app.contactShadows.render = () => {}; for (let i = 0; i < n; i++) app.frame(); }
    finally { app.post.render = render; app.contactShadows.render = shadow; }
    app.contactShadows.render(app.scene); app.post.render();
  }, n);

  for (const uid of uids) {
    const entry = { uid, files: [], error: null };
    report.captures.push(entry);
    const errorsBefore = pageErrors.length;
    try {
      await page.evaluate(async ({ uid, targets }) => {
        matrix.clear();
        if (targets !== 'none') {
          // Stand a cluster of bodies where the bridge's aim lands (70% into
          // the cast's reach, straight ahead), so every capture shows hits.
          try {
            const { settings } = await import('/src/config/settings.js');
            const s = (await matrix.preset(uid))?.settings ?? {};
            const min = s.minRange ?? 0.5, max = s.range ?? min + 6;
            const d = Math.max(2.5, min + (max - min) * 0.7);
            Object.assign(settings.dummies, { formation: targets === 'ring' ? 'ring' : 'cluster', count: 7, minRadius: d - 0.5, radius: d + 0.5 });
          } catch (error) { console.warn('[capture] could not place targets', error); }
        }
        app.dummies.reset?.();
        app.paused = false;
      }, { uid, targets: String(flags.targets ?? 'cluster') });
      await tick(3);
      await page.evaluate(async (uid) => {
        // The bridge's cast waits on animation frames; keep the clock running for it.
        let on = true;
        const pump = () => { if (!on) return; app.frame(); requestAnimationFrame(pump); };
        requestAnimationFrame(pump);
        try { await matrix.cast(uid); } finally { on = false; }
      }, uid);
      let at = 0;
      const base = uid.replace('/', '__');
      for (const f of frames) {
        await tick(f - at);
        at = f;
        const file = `${base}-f${f}.png`;
        await page.screenshot({ path: `${outDir}/${file}`, timeout: 120000 });
        entry.files.push(file);
      }
      if (pageErrors.length > errorsBefore) entry.error = pageErrors.slice(errorsBefore).join('\n');
    } catch (error) {
      entry.error = String(error?.message ?? error);
    }
    if (entry.error) report.errors.push(`${uid}: ${entry.error}`);
  }

  if (flags.sheet) {
    // Compose with the browser itself: no image dependency needed.
    for (const entry of report.captures) {
      if (!entry.files.length) continue;
      const sheet = await browser.newPage({ viewport: { width: 480 * entry.files.length, height: 340 } });
      const { readFileSync } = await import('node:fs');
      const imgs = entry.files.map((f, i) => {
        const data = readFileSync(`${outDir}/${f}`).toString('base64');
        return `<figure><img src="data:image/png;base64,${data}"><figcaption>${entry.uid} · frame ${frames[i]} (${(frames[i] / 30).toFixed(2)} s)</figcaption></figure>`;
      }).join('');
      await sheet.setContent(`<style>body{margin:0;display:flex;background:#111;font:12px sans-serif;color:#ddd}figure{margin:0;width:480px}img{width:480px;height:300px;object-fit:cover;display:block}figcaption{padding:6px}</style>${imgs}`);
      const file = `${entry.uid.replace('/', '__')}-sheet.jpg`;
      // JPEG keeps a committed reference sheet small (~150 KB).
      await sheet.screenshot({ path: `${outDir}/${file}`, type: 'jpeg', quality: 80 });
      entry.sheet = file;
      await sheet.close();
    }
  }
} catch (error) {
  report.errors.push(`setup: ${error?.stack ?? error}`);
} finally {
  writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  await server?.close();
  releaseSlot();
}
console.log(JSON.stringify({ out: outDir, captures: report.captures.map((c) => ({ uid: c.uid, sheet: c.sheet, frames: c.files.length, error: c.error })) }, null, 1));
if (report.errors.length) process.exitCode = 1;
