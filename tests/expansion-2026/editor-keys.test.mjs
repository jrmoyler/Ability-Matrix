import test from 'node:test';
import assert from 'node:assert/strict';
import { expansionRoster } from '../../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js';
import { Editor } from '../../packs/sandbox/src/ui/Editor.js';

/**
 * A stand-in for lil-gui that fails the way the real one does: a controller
 * bound to a key the settings block does not have throws at boot (lil-gui's
 * ColorController reads `object[key].toHexString`), which takes the whole
 * sandbox down. Unit tests with forgiving mock editors miss this, so every
 * registered cast's editor is built here against its own settings.
 */
function strictGui(owner, path = owner) {
  const check = (object, key, kind) => {
    assert.ok(key in object, `${path}: ${kind} control "${key}" has no settings key`);
    if (kind === 'color') assert.match(String(object[key]), /^#[0-9a-f]{6}$/i, `${path}: "${key}" is not a #rrggbb colour`);
  };
  const controller = () => {
    const c = { name: () => c, onChange: () => c, onFinishChange: () => c, listen: () => c, step: () => c, min: () => c, max: () => c, disable: () => c, updateDisplay: () => c };
    return c;
  };
  const gui = {
    add(object, key) { check(object, key, 'value'); return controller(); },
    addColor(object, key) { check(object, key, 'color'); return controller(); },
    addFolder(title) { return strictGui(owner, `${path} / ${title}`); },
    close: () => gui,
    open: () => gui,
    destroy: () => {},
    controllersRecursive: () => [],
    folders: [],
    children: []
  };
  return gui;
}

test('every registered expansion cast builds its editor from keys its settings actually have', () => {
  const roster = expansionRoster();
  assert.ok(roster.length >= 46);
  for (const cast of roster) {
    const c = structuredClone(cast.config.settings);
    assert.doesNotThrow(() => cast.buildEditor(strictGui(cast.uid), c, Editor), cast.uid);
  }
});
