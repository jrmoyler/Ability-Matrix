import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location = { search: '' };
globalThis.window = { fetch: globalThis.fetch };
const { installMatrixBridge } = await import('../packs/sandbox/src/bridge/MatrixBridge.js');

test('a newer bridge action cancels the deferred URL action, while an untouched URL still starts', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let timerId = 0;
  const timers = new Map();
  globalThis.setTimeout = (fn) => { const id = ++timerId; timers.set(id, fn); return id; };
  globalThis.clearTimeout = (id) => timers.delete(id);
  try {
    const setup = (search) => {
      globalThis.location.search = search;
      const messages = [];
      let listener;
      globalThis.window = { parent: { postMessage: (msg) => messages.push(msg) }, addEventListener: (_, fn) => { listener = fn; } };
      const selections = [];
      const app = { uids: ['old', 'new'], select: async (uid) => { selections.push(uid); return { uid }; }, clearEffects() {} };
      const api = installMatrixBridge(app);
      return { api, app, messages, selections, send: (matrix, uid) => listener({ data: { matrix, uid } }) };
    };
    const runTimers = () => { const pending = [...timers.values()]; timers.clear(); for (const fn of pending) fn(); };
    const initial = setup('?ability=old');
    assert.equal(initial.messages[0].matrix, 'ready');
    runTimers();
    await Promise.resolve();
    assert.deepEqual(initial.selections, ['old']);

    const newer = setup('?ability=old&cast=1');
    await newer.send('select', 'new');
    runTimers();
    await Promise.resolve();
    assert.deepEqual(newer.selections, ['new']);

    const direct = setup('?ability=old');
    await direct.api.select('new');
    runTimers();
    assert.deepEqual(direct.selections, ['new']);

    const stopped = setup('?ability=old&auto=3');
    await stopped.send('stop');
    runTimers();
    assert.deepEqual(stopped.selections, []);

    const failed = setup('?ability=old');
    failed.app.select = async () => { throw new Error('initial selection failed'); };
    runTimers();
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(failed.messages.some((message) => message.matrix === 'error' && message.message === 'initial selection failed'));
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
