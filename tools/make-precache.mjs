// Writes <site>/precache.json: the version and a content hash for every file
// the service worker may cache, and stamps that version into sw.js so every
// release is a new worker. Run by stage-site.sh after the site is assembled.
//   shell   files the app needs to open at all (precached on install)
//   files   path -> hash and size for everything else (the opt-in offline download)
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const site = path.resolve(process.argv[2] || fileURLToPath(new URL('../site', import.meta.url)));
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const file = path.join(dir, e.name);
  return e.isDirectory() ? walk(file) : [file];
});
const rel = (f) => path.relative(site, f).split(path.sep).join('/');

const SKIP = new Set(['sw.js', 'precache.json']);
const SHELL = ['index.html', 'manifest.webmanifest', 'presets/catalog.json', 'packs/sandbox/index.html'];
const files = {};
for (const f of walk(site).sort()) {
  const p = rel(f);
  if (SKIP.has(p)) continue;
  files[p] = { hash: createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12), size: statSync(f).size };
}
const shell = [...SHELL, ...Object.keys(files).filter((p) => p.startsWith('icons/'))].filter((p) => files[p]);
const version = createHash('sha1').update(Object.entries(files).map(([p, f]) => p + f.hash).join('|')).digest('hex').slice(0, 10);
const bytes = Object.values(files).reduce((n, f) => n + f.size, 0);
writeFileSync(path.join(site, 'precache.json'), JSON.stringify({ version, shell, files }));
const sw = path.join(site, 'sw.js');
writeFileSync(sw, readFileSync(sw, 'utf8').replace('__BUILD__', version));
console.log(`precache ${version}: ${Object.keys(files).length} files, ${(bytes / 1048576).toFixed(1)} MB`);
