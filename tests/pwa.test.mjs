// Guards the installable-app pieces: manifest, icons, service worker stamping and the shell hooks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(path.join(root, file));
const text = (file) => read(file).toString('utf8');
const manifest = JSON.parse(text('manifest.webmanifest'));

test('manifest describes an installable standalone app', () => {
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name && manifest.start_url && manifest.scope);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  const sizes = (purpose) => manifest.icons.filter((i) => i.purpose === purpose && i.type === 'image/png').map((i) => i.sizes);
  assert.ok(sizes('any').includes('192x192') && sizes('any').includes('512x512'));
  assert.ok(sizes('maskable').includes('512x512'));
});

test('every manifest icon exists and the PNGs are the size they claim', () => {
  for (const icon of manifest.icons) {
    const file = read(icon.src);
    if (icon.type !== 'image/png') continue;
    const [w, h] = icon.sizes.split('x').map(Number);
    assert.equal(file.readUInt32BE(16), w, `${icon.src} width`);
    assert.equal(file.readUInt32BE(20), h, `${icon.src} height`);
  }
  assert.equal(read('icons/apple-touch-icon.png').readUInt32BE(16), 180);
});

test('the matrix page links the manifest, icons and registers the worker', () => {
  const html = text('index.html');
  for (const needle of ['rel="manifest" href="manifest.webmanifest"', 'rel="apple-touch-icon"', 'name="theme-color"', 'apple-mobile-web-app-capable', "register('sw.js')", 'id="guide"', 'beforeinstallprompt']) {
    assert.ok(html.includes(needle), needle);
  }
});

test('make-precache hashes the site and stamps a release into sw.js', () => {
  const site = mkdtempSync(path.join(tmpdir(), 'matrix-site-'));
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) cpSync(path.join(root, f), path.join(site, f));
  cpSync(path.join(root, 'icons'), path.join(site, 'icons'), { recursive: true });
  mkdirSync(path.join(site, 'presets'));
  mkdirSync(path.join(site, 'packs/sandbox'), { recursive: true });
  writeFileSync(path.join(site, 'presets/catalog.json'), '{}');
  mkdirSync(path.join(site, 'presets/mechanics'), { recursive: true });
  writeFileSync(path.join(site, 'presets/mechanics/catalog.json'), '{}');
  writeFileSync(path.join(site, 'packs/sandbox/index.html'), '<!doctype html>');
  const run = () => execFileSync('node', [path.join(root, 'tools/make-precache.mjs'), site], { encoding: 'utf8' });
  assert.match(run(), /precache [0-9a-f]{10}: \d+ files/);
  const pre = JSON.parse(readFileSync(path.join(site, 'precache.json'), 'utf8'));
  assert.ok(pre.shell.includes('presets/mechanics/catalog.json'));
  for (const f of pre.shell) assert.ok(pre.files[f], `shell file ${f} is hashed`);
  assert.ok(!('sw.js' in pre.files) && !('precache.json' in pre.files));
  const sw = readFileSync(path.join(site, 'sw.js'), 'utf8');
  assert.ok(sw.includes(`const BUILD = '${pre.version}'`) && !sw.includes('__BUILD__'));
  // A changed file is a new release, so browsers fetch a new worker.
  writeFileSync(path.join(site, 'packs/sandbox/index.html'), '<!doctype html><title>x</title>');
  cpSync(path.join(root, 'sw.js'), path.join(site, 'sw.js'));
  run();
  assert.notEqual(JSON.parse(readFileSync(path.join(site, 'precache.json'), 'utf8')).version, pre.version);
});

test('the unstamped worker is a pass-through and the host never caches it', () => {
  assert.match(text('sw.js'), /const LIVE = !BUILD\.startsWith\('__'\)/);
  const headers = JSON.parse(text('vercel.json')).headers;
  const sw = headers.find((h) => h.source === '/sw.js');
  assert.ok(sw.headers.some((h) => h.key === 'Cache-Control' && /no-cache/.test(h.value)));
});

test('staging ships the PWA files', () => {
  const stage = text('tools/stage-site.sh');
  for (const needle of ['manifest.webmanifest', 'sw.js', 'icons', 'make-precache.mjs']) assert.ok(stage.includes(needle), needle);
});
