import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HUD } from '../packs/sandbox/src/ui/HUD.js';

test('the matrix loading label is actually removed from layout when the range is ready', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  // The rule that displays the loading indicator is author CSS and therefore
  // overrides the browser's default [hidden] rule without this more specific rule.
  assert.match(html, /\.screen\s+\.loading\[hidden\]\s*\{\s*display:\s*none\s*;?\s*\}/);
  assert.match(html, /id="loading"\s+role="status"/);
});

test('finishing an older engine load cannot dismiss a newer notification', () => {
  const classes = new Set();
  const hud = Object.create(HUD.prototype);
  hud.toast = {
    textContent: '',
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) }
  };
  const old = hud.showToast('Loading one…', 60_000);
  const latest = hud.showToast('A newer result', 60_000);
  hud.dismissToast(old);
  assert.equal(hud.toast.textContent, 'A newer result');
  assert.ok(classes.has('is-visible'));
  hud.dismissToast(latest);
  assert.equal(classes.has('is-visible'), false);
});
