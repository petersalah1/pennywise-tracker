// ================================================================
// Pennywise PWA - Service Worker (Offline First)
// ================================================================

const CACHE_NAME = "pennywise-cache-v1";

// Essential routes & assets to cache on install
const PRECACHE_URLS = [
  "/",
  "/wallets",
  "/transactions",
  "/categories",
  "/analytics",
  "/settings",
  "/login",
  "/reset-password",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico",
];

// Install Event: pre-cache application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Cache assets gracefully (don't fail entire install if one URL fails)
        await Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Precache failed for ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: clean up outdated caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: handle requests with smart caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. Skip non-http(s) schemes (e.g., chrome-extension)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // 3. Skip Supabase API calls (let the application's offline sync queue handle data persistence)
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // 4. Next.js Static Chunks & Assets (/_next/static/...) -> Cache-First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. HTML Navigation Requests (Page Visits) -> Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, attempt exact match in cache
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }

          // Fallback to cached home page so Next.js client router takes over
          const fallbackHome = await caches.match("/");
          if (fallbackHome) {
            return fallbackHome;
          }

          // Ultimate offline fallback HTML
          return new Response(
            `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>بيني وايز — غير متصل</title>
  <style>
    body { background: #0b100d; color: #f3f7f4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #111914; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 32px 24px; max-width: 420px; }
    h1 { color: #65d891; font-size: 20px; margin-bottom: 8px; }
    p { color: #829087; font-size: 13px; line-height: 1.6; }
    a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #65d891; color: #0a160e; font-weight: bold; border-radius: 12px; text-decoration: none; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>بيني وايز — وضع عدم الاتصال</h1>
    <p>أنت حالياً غير متصل بشبكة الإنترنت. يمكنك الاستمرار في استخدام التطبيق والرجوع للصفحة الرئيسية المحفوظة مسبقاً.</p>
    <a href="/">فتح لوحة التحكم المحفوظة</a>
  </div>
</body>
</html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  // 6. All other requests (images, icons, fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
