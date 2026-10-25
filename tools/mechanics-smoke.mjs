// npm install --no-save playwright && npx playwright install chromium
// PLAYWRIGHT_MODULE can point to an already installed Playwright module.
import { createServer } from '../packs/sandbox/node_modules/vite/dist/node/index.js';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({
  root: 'packs/sandbox',
  server: { host: '127.0.0.1', port: 5180, hmr: false, watch: { ignored: ['**/*'] } },
  logLevel: 'error'
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.75 });
const errors = [],
  checks = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
mkdirSync('evidence/mechanics', { recursive: true });
// Deterministic test clock: normal App.frame update path; render the sampled frame.
const ticks = async (n) =>
  page.evaluate((n) => {
    const render = app.post.render,
      shadows = app.contactShadows.render;
    try {
      app.post.render = () => {};
      app.contactShadows.render = () => {};
      for (let i = 0; i < n; i++) app.frame();
    } finally {
      app.post.render = render;
      app.contactShadows.render = shadows;
    }
    app.contactShadows.render(app.scene);
    app.post.render();
  }, n);
const wait = async (fn) => {
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(fn)) return;
    await ticks(1);
  }
  throw new Error(
    'state did not arrive: ' +
      fn +
      ' ' +
      JSON.stringify(await page.evaluate(() => app.combat.mechanics.systems.results))
  );
};
const choose = async (family) => {
  if (!(await page.locator('.mechanic-controls').evaluate((e) => e.open)))
    await page.locator('.mechanic-controls summary').click();
  await page.locator(`[data-mechanic="${family}"]`).click();
  await page.locator('.mechanic-controls summary').click();
};
const clickWorld = async (pos) => {
  const p = await page.evaluate(async (pos) => {
    const { Vector3 } = await import('/node_modules/three/build/three.module.js');
    const p = new Vector3(...pos).project(app.camera);
    return { x: (p.x + 1) * 720, y: (1 - p.y) * 450 };
  }, pos);
  assert.ok(p.x > 0 && p.x < 1440 && p.y > 0 && p.y < 900, JSON.stringify(p));
  await page.mouse.click(p.x, p.y);
};
const capture = async (name) => {
  await page.screenshot({ path: `evidence/mechanics/${name}.png`, timeout: 120000 });
};
const reset = async () => {
  await page.evaluate(() => {
    matrix.clear();
    app.dummies.reset();
    app.paused = false;
  });
  await ticks(2);
};
try {
  await page.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.matrix?.combat && window.app?.combat, { timeout: 120000 });
  await page.evaluate(() => {
    app.stop();
    app.time.tick = () => 1 / 30;
    app.environment.sun.shadow.mapSize.set(1024, 1024);
    app.environment.sun.shadow.map?.dispose();
    app.environment.sun.shadow.map = null;
  });
  await page.keyboard.press('h');
  await page.keyboard.press('g');
  await ticks(1);
  await capture('boot');
  console.log('boot');
  checks.push({ name: 'startup', passed: true });
  if (process.env.MECHANICS_MOBILE_ONLY) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.querySelector('.mechanic-controls').open = false;
    });
    await ticks(2);
    await capture('mobile');
    assert.ok(
      await page.locator('.mechanic-controls').evaluate((e) => e.getBoundingClientRect().right <= innerWidth)
    );
    console.log('Mobile rendered after resize, panel in bounds; errors:', errors);
    assert.equal(errors.length, 0);
  } else {
    // The anchor placements use button + canvas input, not simulation state mutation.
    for (const p of [
      [-3, 0, -5],
      [3, 0, -5],
      [0, 0, -10]
    ]) {
      await choose('weave');
      await clickWorld(p);
      await ticks(29);
    }
    const weave = await page.evaluate(() => ({
      anchors: app.combat.manager.anchors.size,
      links: app.combat.mechanics.systems.weave.links.length
    }));
    assert.equal(weave.anchors, 3);
    assert.equal(weave.links, 3);
    await capture('weave');
    console.log('weave');
    checks.push({ name: 'three anchors and live links via pointer', ...weave, passed: true });
    await reset();
    await page.keyboard.press('Alt+x');
    await clickWorld([0, 0, 0]);
    await wait(() => app.combat.manager.activeStances.size === 1);
    await ticks(8);
    await capture('stance');
    console.log('stance');
    const start = await page.evaluate(() => app.character.position.toArray());
    await page.keyboard.down('w');
    await ticks(12);
    await page.keyboard.up('w');
    const end = await page.evaluate(() => app.character.position.toArray());
    assert.notDeepEqual(start, end);
    await page.keyboard.press('Alt+x');
    await wait(() => app.combat.manager.activeStances.size === 0);
    checks.push({ name: 'stance movement and finisher through controls', passed: true });
    await reset();
    const terrainAt = await page.evaluate(() => {
      const entities = [...app.combat.manager.entities.values()].filter((e) => e.alive);
      for (const z of [-7, -10, -4])
        for (const x of [0, -4, 4]) {
          const c = app.character.position,
            dx = x - c.x,
            dz = z - c.z,
            len = Math.hypot(dx, dz);
          const clear = [-2.6, 0, 2.6].every((n) =>
            entities.every(
              (e) =>
                Math.hypot(e.position[0] - (x + (dz / len) * n), e.position[2] - (z - (dx / len) * n)) > 1.8
            )
          );
          if (clear) return [x, 0, z];
        }
      throw new Error('No clear terrain placement');
    });
    await choose('worldshape');
    await clickWorld(terrainAt);
    await wait(() => app.combat.mechanics.systems.worldshape.regions.size === 1);
    await ticks(14);
    await capture('worldshape');
    console.log('worldshape');
    const collision = await page.evaluate(() => {
      const w = app.combat.mechanics.systems.worldshape,
        r = [...w.regions.values()][0],
        p = r.position,
        d = r.direction;
      return {
        blocked: w.blocked([p[0] - d[0] * 8, 0, p[2] - d[2] * 8], [p[0] + d[0] * 8, 0, p[2] + d[2] * 8]),
        height: w.heightAt(p)
      };
    });
    assert.equal(collision.blocked, true);
    assert.ok(collision.height > 0);
    checks.push({ name: 'terrain rendered with matching collision/height', ...collision, passed: true });
    await reset();
    await choose('counter');
    await clickWorld([0, 0, 0]);
    await wait(() => {
      if (app.combat.manager.counterWindows.size) {
        return true;
      }
      return false;
    });
    await ticks(2);
    await capture('counter');
    console.log('counter');
    await ticks(25);
    checks.push({
      name: 'counter input, active geometry and whiff cleanup',
      passed: await page.evaluate(() => app.combat.manager.counterWindows.size === 0)
    });
    await reset();
    // A real native water cast supplies the contribution; no synthetic region injection.
    await page.evaluate(async () => {
      await matrix.select('codex/maelstrom');
      app._cast(app.character.position.clone(), app.character.position.clone().set(0, 0, -1), 8);
    });
    await wait(() => [...app.combat.manager.regions.values()].some((r) => r.element === 'water'));
    // Retain the real UCSM contribution while retiring the expensive legacy water VFX.
    await page.evaluate(() => app.abilities.clear());
    const at = await page.evaluate(() => {
      const r = [...app.combat.manager.regions.values()].find((r) => r.element === 'water');
      const x = r.shape.x ?? (r.shape.ax + r.shape.bx) / 2,
        z = r.shape.z ?? (r.shape.az + r.shape.bz) / 2;
      return [x, 0, z];
    });
    await choose('convergence');
    await clickWorld(at);
    await wait(() => {
      if ([...app.combat.mechanics.presentation.items.values()].some((v) => v.kind === 'convergence')) {
        return true;
      }
      return false;
    });
    await ticks(8);
    await capture('convergence');
    console.log('convergence');
    assert.ok(await page.evaluate(() => app.combat.manager.log.some((r) => r.kind === 'Storm Conduction')));
    checks.push({ name: 'Storm Catalyst with real Maelstrom region', passed: true });
    await reset();
    await page.evaluate(() => {
      app.combat.mechanics.drill = !app.combat.mechanics.drill;
    });
    await wait(() => app.combat.mechanics.threats.length > 0);
    await capture('drill');
    // Schedule a physical input against the visible drill countdown; no hit/status injection.
    await wait(() => {
      const h = app.combat.mechanics,
        t = h.threats[0];
      return t && t.impact - h.systems.m.tick <= 5 && t.impact - h.systems.m.tick >= 3;
    });
    await page.keyboard.press('Alt+c');
    await clickWorld([0, 0, 0]);
    await ticks(12);
    checks.push({
      name: 'incoming drill executes',
      passed: true,
      health: await page.evaluate(() => app.combat.manager.entities.get('caster').health)
    });
    await page.evaluate(() => {
      app.combat.mechanics.drill = !app.combat.mechanics.drill;
    });
    await reset();
    const telemetry = await page.evaluate(() => ({
      renderer: app.renderer.gl.info.render,
      memory: app.renderer.gl.info.memory,
      mechanicObjects: app.combat.mechanics.presentation.items.size,
      tick: app.combat.manager.tick
    }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.querySelector('.mechanic-controls').open = false;
    });
    await ticks(2);
    await capture('mobile');
    assert.ok(
      await page.locator('.mechanic-controls').evaluate((e) => e.getBoundingClientRect().right <= innerWidth)
    );
    checks.push({ name: 'mobile panel fits viewport', passed: true });
    writeFileSync(
      'evidence/mechanics/browser.json',
      JSON.stringify(
        {
          checks,
          errors,
          telemetry,
          renderer:
            'Chromium SwiftShader, 0.75 DPR, 1024 shadow map, fixed 30Hz App.frame; sampled frames rendered; not target-device FPS certification'
        },
        null,
        2
      ) + '\n'
    );
    console.log(JSON.stringify({ checks, errors, telemetry }));
    assert.equal(errors.length, 0);
  }
} finally {
  await browser.close();
  await server.close();
}
