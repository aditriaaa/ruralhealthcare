const CACHE = 'ruralhealth-v14';
const OFFLINE_URL = '/offline.html';
const ASSETS = ['/', '/index.html', '/offline.html', '/patient.html', '/provider.html', '/provider-login.html', '/providers-in-area.html', '/styles.css', '/intro.js', '/patient.js', '/provider.js', '/provider-auth.js', '/provider-login.js', '/providers-in-area.js', '/offline-assistant.js', '/i18n.js', '/manifest.json', '/sw.js', '/sw-register.js', '/icons/icon-192.png', '/icons/icon-512.png', '/socket.io/socket.io.js', '/vendor/leaflet/leaflet.css', '/vendor/leaflet/leaflet.js', '/vendor/leaflet/images/marker-icon.png', '/vendor/leaflet/images/marker-shadow.png', '/vendor/leaflet/images/layers.png', '/vendor/leaflet/images/layers-2x.png'];

function cacheSuccessfulGet(request, response) {
  if (!response || !response.ok || request.method !== 'GET') return response;
  caches.open(CACHE).then(cache => cache.put(request, response.clone())).catch(() => {});
  return response;
}

function createApiFallbackResponse() {
  return new Response(JSON.stringify({
    ok: false,
    error: 'Network unavailable. Please check your connection and try again.'
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function createOfflineFallbackResponse() {
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function precacheAssets() {
  const cache = await caches.open(CACHE);
  await Promise.allSettled(
    ASSETS.map(async asset => {
      const response = await fetch(asset, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to precache ${asset}: ${response.status}`);
      }
      await cache.put(asset, response);
    })
  );
}

async function handleRequest(req) {
  const url = new URL(req.url);
  const isGet = req.method === 'GET';
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = req.mode === 'navigate';
  const isApiRequest = isSameOrigin && url.pathname.startsWith('/api/');

  if (isApiRequest) {
    try {
      return await fetch(req);
    } catch {
      return createApiFallbackResponse();
    }
  }

  if (isNavigation) {
    try {
      const response = await fetch(req);
      return cacheSuccessfulGet(req, response);
    } catch {
      const cachedPage = await caches.match(req);
      if (cachedPage) return cachedPage;
      return (await caches.match(OFFLINE_URL)) || createOfflineFallbackResponse();
    }
  }

  if (isGet && isSameOrigin) {
    try {
      const response = await fetch(req);
      return cacheSuccessfulGet(req, response);
    } catch {
      const cached = await caches.match(req);
      return cached || createOfflineFallbackResponse();
    }
  }

  if (isGet) {
    try {
      const cached = await caches.match(req);
      if (cached) return cached;
    } catch {}

    try {
      return await fetch(req);
    } catch {
      return createOfflineFallbackResponse();
    }
  }

  try {
    return await fetch(req);
  } catch {
    return createOfflineFallbackResponse();
  }
}

self.addEventListener('install', evt => {
  evt.waitUntil(precacheAssets());
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', evt => {
  if (evt.data && evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Use network-first for same-origin GET requests so UI/CSS updates appear quickly,
// fallback to cache when offline.
self.addEventListener('fetch', evt => {
  evt.respondWith(handleRequest(evt.request));
});