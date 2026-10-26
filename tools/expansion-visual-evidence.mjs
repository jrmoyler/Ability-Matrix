// PR evidence only: real WebGL captures do not themselves establish quality parity.
// Install root and sandbox dependencies, then playwright@1.51.1 + Chromium.
import { createServer } from '../packs/sandbox/node_modules/vite/dist/node/index.js';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const out = 'evidence/expansion-ci';
mkdirSync(out, { recursive: true });
const report = { started: new Date().toISOString(), captures: [], errors: [], limitations: [
  'Frames use fixed 30 Hz simulation and software WebGL; this is not a performance test.',
  'Screenshots require human review; captures alone do not certify visual parity or playability.'
] };
let server, browser;
try {
  server = await createServer({ root: 'packs/sandbox', server: { host: '127.0.0.1', port: 5180, hmr: false, watch: { ignored: ['**/*'] } }, logLevel: 'error' });
  await server.listen();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.75 });
  page.on('pageerror', e => report.errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`console: ${m.text()}`); });
  await page.goto('http://127.0.0.1:5180/?expansionDev=1&hud=0', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.matrix && window.app?.expansionDev, { timeout: 120000 });
  await page.evaluate(() => {
    app.stop(); app.time.tick = () => 1 / 30;
    app.environment.sun.shadow.mapSize.set(1024, 1024);
    app.environment.sun.shadow.map?.dispose(); app.environment.sun.shadow.map = null;
  });
  const tick = async n => page.evaluate(n => {
    const render = app.post.render, shadow = app.contactShadows.render;
    try { app.post.render = () => {}; app.contactShadows.render = () => {}; for (let i = 0; i < n; i++) app.frame(); }
    finally { app.post.render = render; app.contactShadows.render = shadow; }
    app.contactShadows.render(app.scene); app.post.render();
  }, n);
  const items = await page.evaluate(() => [...app.expansionDev.byUid].map(([uid, value]) => ({ uid, id: value.ID, label: value.config.meta.label, element: value.config.meta.element })));
  assert.equal(items.length, 25, 'expected all 25 experimental candidates');
  await page.locator('summary').filter({ hasText: 'Experimental cast tests' }).click();
  const select = page.getByLabel('Experimental castable');
  // The default camera is on positive Z, so cast away from it into the view.
  await page.getByLabel('Heading in degrees').fill('180');
  for (const item of items) {
    const entry = { ...item, files: [], error: null };
    report.captures.push(entry);
    try {
      await page.evaluate(() => { matrix.clear(); app.dummies.reset(); app.paused = false; });
      await tick(2);
      await select.selectOption(item.id);
      const panel = page.locator('details').filter({ hasText: 'Experimental cast tests' });
      await panel.getByRole('button', { name: 'Cast', exact: true }).click();
      const status = await panel.locator('p').first().textContent();
      assert.ok(status?.startsWith('Started '), `cast did not start: ${status}`);
      // Close the test controls to keep the scene unobstructed.
      await page.locator('summary').filter({ hasText: 'Experimental cast tests' }).click();
      for (const [frame, step] of [[15, 15], [45, 30], [90, 45]]) {
        await tick(step);
        const filename = `${item.uid.split('/').pop()}-${frame}.png`;
        await page.screenshot({ path: `${out}/${filename}`, timeout: 120000 });
        entry.files.push(filename);
      }
      await page.locator('summary').filter({ hasText: 'Experimental cast tests' }).click();
    } catch (error) { entry.error = error.message; report.errors.push(`${item.uid}: ${error.message}`); break; }
  }
} catch (error) { report.errors.push(`setup: ${error.stack || error.message}`); }
finally {
  report.finished = new Date().toISOString();
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser?.close(); await server?.close();
}
if (report.errors.length || report.captures.length !== 25 || report.captures.some(x => x.files.length !== 3)) process.exitCode = 1;
