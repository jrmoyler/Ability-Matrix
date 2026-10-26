import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('first visit does not open a modal over an automatic cast; the Guide remains an accessible button', () => {
  const boot = html.slice(html.indexOf("Promise.all([fetch('presets/catalog.json')"));
  assert.ok(boot.includes('select(start, { cast: true });'));
  assert.doesNotMatch(boot, /\bopenGuide\s*\(/);
  assert.match(html, /<button\b[^>]*\bid="helpBtn"[^>]*\btype="button"[^>]*>Guide<\/button>/);
  assert.match(html, /\$\('helpBtn'\)\.onclick\s*=\s*\(\)\s*=>\s*openGuide\(0\)/);
});

test('aim filters include live ground and self mechanics and ignore empty or archived aims', () => {
  const match = html.match(/const casts = (\[\.\.\.new Set\(c\.abilities\.filter\([^\n]+\)\]);/);
  assert.ok(match, 'shell defines aim choices from the actual catalog');
  const c = { abilities: [
    { status:'live', kind:'ability', cast:'line' },
    { status:'live', kind:'mechanic', cast:'ground' },
    { status:'live', kind:'mechanic', cast:'self' },
    { status:'live', kind:'mechanic', cast:'ground' },
    { status:'live', kind:'mechanic', cast:null },
    { status:'archived', kind:'mechanic', cast:'obsolete' }
  ] };
  const values = vm.runInNewContext(match[1], { c });
  assert.deepEqual(Array.from(values), ['line', 'ground', 'self']);
});

test('descriptions have a keyboard-accessible disclosure on mobile and stage status stays at the edge', () => {
  assert.match(html, /<button\b[^>]*id="descriptionToggle"[^>]*aria-expanded="false"[^>]*aria-controls="nowHint"/);
  assert.match(html, /<p id="nowHint" hidden>/);
  assert.match(html, /\$\('descriptionToggle'\)\.onclick/);
  assert.doesNotMatch(html, /\.now p, \.stage \.note\s*\{\s*display:\s*none/);
  const loadingRule = html.match(/\.screen \.loading\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.match(loadingRule, /top:\s*\d/);
  assert.doesNotMatch(loadingRule, /inset:\s*0|place-items:\s*center/);
});
