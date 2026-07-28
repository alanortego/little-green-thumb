import { ApiError, api, apiRaw } from './api';

const DB_NAME = 'lgt-offline-queue';
const STORE = 'pending-actions';

interface PendingAction {
  id: string;
  path: string;
  method: string;
  body: unknown;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.addEventListener('error', () => reject(req.error));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.addEventListener('error', () => reject(req.error));
  });
}

/**
 * Queues a Cookbook mutation (add/made/rating, FR-020) in IndexedDB when the
 * network is unavailable, so a student's tap isn't lost while offline in
 * the garden. Called by the Cookbook screens instead of `api()` directly
 * for these three write endpoints.
 */
export async function enqueueOrSend<T>(
  path: string,
  method: string,
  body: unknown,
): Promise<{ status: number; body: T } | null> {
  try {
    return await apiRaw<T>(path, { method, body: JSON.stringify(body) });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error; 
    } // Server reached and rejected — surface it, don't queue
    const action: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      path,
      method,
      body,
      createdAt: Date.now(),
    };
    await withStore('readwrite', (store) => store.put(action));
    return null; // Caller shows an optimistic "saved, will sync" state
  }
}

/** Replays every queued action in order; drops each on success. Safe to call repeatedly. */
export async function replayQueue(): Promise<void> {
  const actions = await withStore<PendingAction[]>('readonly', (store) => store.getAll());
  for (const action of actions.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await api(action.path, { method: action.method, body: JSON.stringify(action.body) });
      await withStore('readwrite', (store) => store.delete(action.id));
    } catch {
      break; // Still offline (or a real error) — stop and retry later
    }
  }
}

/** Wires automatic replay whenever connectivity returns. */
export function startOfflineQueueSync(): () => void {
  const handler = () => void replayQueue();
  window.addEventListener('online', handler);
  void replayQueue();
  return () => window.removeEventListener('online', handler);
}
