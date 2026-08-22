/**
 * Nutri-Track Service Worker
 * Secure PWA Service Worker with strict isolation of private health data & APIs.
 */

const CACHE_NAME = "nutritrack-static-v1";
const OFFLINE_FALLBACK = "/offline.html";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
  "/icons/apple-touch-icon.svg",
];

// Install: Cache essential static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Safe Caching Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. STRICT SECURITY RULE: NEVER cache or intercept /api/* or auth requests
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) {
    return; // Pass through directly to network
  }

  // 2. Do not intercept non-GET requests (POST, PUT, DELETE, PATCH)
  if (request.method !== "GET") {
    return;
  }

  // 3. Static Assets: Cache-first with network fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. HTML Page Navigation: Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_FALLBACK).then((fallback) => {
          return fallback || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        });
      })
    );
  }
});
