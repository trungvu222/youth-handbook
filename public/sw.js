// ============================================================
// Service Worker - Sổ Tay Đoàn Viên PWA
// ============================================================

const CACHE_NAME = 'stn-doan-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/Logo-Web.jpg',
  '/Icon-App-Chua-tach-nen.jpg',
];

// ── Install: cache app shell ──────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// ── Activate: xoá cache cũ ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua: không phải GET, gọi API backend (Render/Neon), extensions
  if (
    request.method !== 'GET' ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('neon.tech') ||
    url.hostname.includes('vercel-insights') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // Next.js API routes → network-first (không cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (_next/static) → cache-first
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

  // Trang HTML (navigate) → network-first, fallback cache
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
          () => caches.match(request) || caches.match('/')
        )
    );
    return;
  }

  // Mọi thứ còn lại (hình ảnh, fonts) → cache-first
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
