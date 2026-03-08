// ============================================================
// Service Worker - Admin PWA (scope: /admin/)
// Tách biệt hoàn toàn với user SW (/sw.js scope: /)
// ============================================================

const CACHE_NAME = 'stn-admin-v1';
const APP_SHELL = [
  '/admin',
  '/admin-manifest.json',
  '/Huy_Hieu_Doan.png',
];

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Không fail cả install nếu cache 1 file lỗi
      })
    )
  );
});

// ── Activate: xoá cache admin cũ ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('stn-admin-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua: không phải GET, API calls
  if (
    request.method !== 'GET' ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('neon.tech') ||
    url.hostname.includes('vercel-insights') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // API routes → network only (admin data phải luôn mới nhất)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(request, response.clone())
              );
            }
            return response;
          })
      )
    );
    return;
  }

  // Trang admin (navigate) → network-first, fallback cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, response.clone())
            );
          }
          return response;
        })
        .catch(
          () =>
            caches.match(request) ||
            caches.match('/admin') ||
            new Response('Offline - Vui lòng kết nối mạng', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        )
    );
    return;
  }

  // Hình ảnh, fonts → cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, response.clone())
            );
          }
          return response;
        })
    )
  );
});
