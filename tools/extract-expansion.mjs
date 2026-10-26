// Export candidate metadata and portable presets without promoting any move.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expansionRoster } from '../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js';
const dir = new URL('../presets/expansion/', import.meta.url);
mkdirSync(dir, { recursive: true });
const abilities = expansionRoster().map(({ uid, ID, config, status }) => {
  const m = config.meta, s = config.settings;
  const glyph = m.glyph ? `<svg class="glyph-svg" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${m.glyph}</svg>` : null;
  const row = { uid, pack: 'matrix-expansion', id: ID, kind: 'ability', element: m.element,
    label: m.label, hint: m.hint ?? '', accent: m.accent ?? '#fff', key: m.key ?? '', cast: m.cast ?? 'line',
    castAnim: s.castAnim, cooldown: s.cooldown, range: s.range, minRange: s.minRange ?? 0,
    zoneRadius: s.zoneRadius ?? null, status, glyph };
  writeFileSync(new URL(`${uid.split('/').at(-1)}.json`, dir), JSON.stringify({ format: 'collective-ability-preset@1', ...row, settings: s }, null, 2) + '\n');
  return row;
});
writeFileSync(new URL('catalog.json', dir), JSON.stringify({ format: 'collective-expansion-catalog@1', abilities }, null, 2) + '\n');
