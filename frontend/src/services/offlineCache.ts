const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const CACHE_NAME = 'lgt-plants-v1';

/**
 * Registers the hand-written service worker (public/sw.js) that caches
 * GET /plants, GET /plants/:id, GET /plants/:id/recipes, GET /recipes/:id,
 * and their media so the plant/recipe screens keep working offline
 * (FR-020). ponytail: a small custom SW is enough for these cached
 * endpoint shapes — no Workbox/vite-plugin-pwa needed for this scope.
 */
export function registerOfflineCache(): void {
  if (!('serviceWorker' in navigator)) {
    return; 
  }
  void navigator.serviceWorker.register('/sw.js');
}

/** Reads the last cached `GET /plants` list, for offline browsing/QR fallback. */
export async function getCachedPlants(): Promise<
  { id: number; name: string; qr_code: string; image_path: string | null; benefit_text: string | null }[]
> {
  if (!('caches' in window)) {
    return []; 
  }
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(`${API_BASE}/plants`);
  if (!match) {
    return []; 
  }
  return match.json();
}
