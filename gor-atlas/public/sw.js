/*
 * Gor Atlas service worker.
 *
 * Built for the connection this archive will actually be read on: an
 * inexpensive Android handset on a metered, intermittent network.
 *
 * Three strategies, chosen per request type:
 *
 *   - App shell and static build assets: cache-first. They are content-hashed,
 *     so a stale hit is never a wrong hit.
 *   - Pages: network-first with a cache fallback. A reader who loses signal
 *     mid-journey keeps the last version of anything they have opened rather
 *     than a browser error page.
 *   - Map tiles: cache-first with a hard cap. Tiles are the single largest
 *     data cost on this site, and re-downloading the same district repeatedly
 *     is exactly what burns a limited data bundle.
 *
 * Deliberately never cached: /api/submissions, /admin and anything carrying an
 * editorial decision. A moderation queue served from a stale cache would show
 * a reviewer the wrong state of a record, and consent state must never be read
 * from a cache that a revocation cannot reach.
 */

const VERSION = "v1";
const SHELL_CACHE = `gor-atlas-shell-${VERSION}`;
const PAGE_CACHE = `gor-atlas-pages-${VERSION}`;
const TILE_CACHE = `gor-atlas-tiles-${VERSION}`;

const TILE_CAP = 400;

const SHELL = ["/", "/map", "/directory", "/offline", "/manifest.webmanifest", "/icon.svg"];

const NEVER_CACHE = [/^\/api\/submissions/, /^\/api\/admin/, /^\/admin/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individually, so one missing entry cannot fail the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("gor-atlas-") && !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && NEVER_CACHE.some((re) => re.test(url.pathname))) return;

  // Map tiles — cache-first, capped.
  if (!sameOrigin && /tile|imagery|MapServer/i.test(url.href)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) {
            await cache.put(request, res.clone());
            trimCache(TILE_CACHE, TILE_CAP);
          }
          return res;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  if (!sameOrigin) return;

  // Build assets — cache-first, safe because filenames are content-hashed.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Pages and read APIs — network-first, fall back to the last good copy.
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (request.mode === "navigate") {
            const offline = await caches.match("/offline");
            if (offline) return offline;
          }
          return Response.error();
        }
      })(),
    );
  }
});

/*
 * "Save for offline" on a Tanda profile posts here, so saving a settlement
 * genuinely stores the page and its data rather than only setting a flag in
 * localStorage.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "cache-profile" || !data.path) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await Promise.allSettled([
        cache.add(data.path),
        data.apiPath ? cache.add(data.apiPath) : Promise.resolve(),
      ]);
    })(),
  );
});
