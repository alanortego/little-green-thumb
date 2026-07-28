self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const CACHE_NAME = 'lgt-plants-v1';

// Cache-first for plant data/media so the library + benefit pages work
// offline (FR-020); everything else passes straight through to the network.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isPlantsApi = event.request.method === 'GET' && /\/plants(\/|$)/.test(url.pathname);
  const isRecipesApi = event.request.method === 'GET' && /\/recipes(\/|$)/.test(url.pathname);
  const isMedia = /\/media\//.test(url.pathname);

  if (!isPlantsApi && !isRecipesApi && !isMedia) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
