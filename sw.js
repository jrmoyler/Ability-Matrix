/* Ability Matrix service worker.
 *
 * - The shell (matrix page, manifest, icons, catalog, sandbox page) is
 *   precached per release, so the app opens instantly and offline.
 * - Everything else under packs/ and presets/ is cached the first time it is
 *   fetched, or all at once when the player taps "Download for offline" (the
 *   page writes those files into DATA itself).
 * - DATA survives releases; on activate, files whose hash changed or that no
 *   longer exist are dropped, so the big models are not re-downloaded needlessly.
 *
 * tools/make-precache.mjs swaps in the release id below. An unstamped copy
 * (dev, or a plain source checkout) is a pass-through, so it never serves stale code.
 */
const BUILD = '__BUILD__';
const LIVE = !BUILD.startsWith('__');
const SHELL = `am-shell-${BUILD}`;
const DATA = 'am-data';
const FONTS = 'am-fonts';
const here = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  if (!LIVE) return;
  event.waitUntil((async () => {
    const manifest = await (await fetch(here('precache.json'), { cache: 'no-store' })).json();
    const cache = await caches.open(SHELL);
    await cache.put(here('precache.json'), new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/json' } }));
    // Fetch past the HTTP cache so a half-deployed release can't poison the shell.
    await Promise.all(manifest.shell.map(async (path) => {
      const res = await fetch(here(path), { cache: 'reload' });
      if (!res.ok) throw new Error(`precache ${path}: ${res.status}`);
      await cache.put(here(path), res);
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) await self.registration.navigationPreload.disable().catch(() => {});
    const names = await caches.keys();
    const next = LIVE ? await (await caches.open(SHELL)).match(here('precache.json')).then((r) => r && r.json()) : null;
    // Compare against the previous release's manifest to find stale DATA entries.
    let previous = null;
    for (const name of names) {
      if (name.startsWith('am-shell-') && name !== SHELL) previous = await (await caches.open(name)).match(here('precache.json')).then((r) => r && r.json()) || previous;
    }
    if (next) {
      const data = await caches.open(DATA);
      for (const request of await data.keys()) {
        const path = new URL(request.url).pathname.slice(new URL(here('./')).pathname.length);
        const fresh = next.files[path], old = previous && previous.files[path];
        if (!fresh || (old && old.hash !== fresh.hash) || (!old && previous)) await data.delete(request);
      }
    }
    await Promise.all(names.filter((n) => n.startsWith('am-shell-') && n !== SHELL).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (!LIVE) return;
  const { request } = event;
  const url = new URL(request.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    if (request.method === 'GET') event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.method === 'HEAD') { event.respondWith(head(request)); return; }
  if (request.method !== 'GET') return;
  event.respondWith(respond(request, url));
});

async function lookup(request) {
  return (await (await caches.open(SHELL)).match(request, { ignoreSearch: true })) || (await (await caches.open(DATA)).match(request, { ignoreSearch: true }));
}

async function respond(request, url) {
  const hit = await lookup(request);
  if (hit) return request.headers.has('range') ? slice(hit, request.headers.get('range')) : hit;
  if (request.mode === 'navigate') {
    // The app is one page; any route inside the scope opens it.
    try { return await fetch(request); } catch {
      const shell = await (await caches.open(SHELL)).match(here('index.html'));
      if (shell) return shell;
      throw new Error('offline');
    }
  }
  const res = await fetch(request);
  const scoped = url.pathname.startsWith(new URL(here('packs/')).pathname) || url.pathname.startsWith(new URL(here('presets/')).pathname);
  if (scoped && res.status === 200 && !request.headers.has('range')) (await caches.open(DATA)).put(request, res.clone()).catch(() => {});
  return res;
}

/** Existence probes (the page HEADs the staged HDR) must work offline too. */
async function head(request) {
  const hit = await lookup(new Request(request.url));
  if (!hit) return fetch(request);
  return new Response(null, { status: 200, headers: hit.headers });
}

/** Cached bodies are whole files; honour a single `bytes=a-b` range from them. */
async function slice(res, header) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return res;
  const blob = await res.clone().blob();
  const total = blob.size;
  const start = m[1] === '' ? Math.max(0, total - Number(m[2])) : Number(m[1]);
  const end = m[1] === '' || m[2] === '' ? total - 1 : Math.min(Number(m[2]), total - 1);
  if (start >= total) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
  const headers = new Headers(res.headers);
  headers.set('content-range', `bytes ${start}-${end}/${total}`);
  headers.set('content-length', String(end - start + 1));
  return new Response(blob.slice(start, end + 1), { status: 206, headers });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  const refresh = fetch(request).then((res) => { if (res.ok || res.type === 'opaque') cache.put(request, res.clone()); return res; });
  if (hit) { refresh.catch(() => {}); return hit; }
  return refresh;
}
