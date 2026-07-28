const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

/** Builds an absolute API URL — for links opened directly by the browser
 *  (e.g. window.open) rather than fetched via api()/apiRaw(). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export class ApiError extends Error {
  public status: number;
  public body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Minimal fetch wrapper: JSON in/out, credentials for the session cookie,
 * throws ApiError on non-2xx. ponytail: no client library needed for ~20
 * endpoints — add one (e.g. openapi-fetch) only if the contract grows large
 * enough that hand-written calls become error-prone.
 */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { body } = await apiRaw<T>(path, options);
  return body;
}

/** Like `api()`, but also returns the HTTP status — for callers that need to
 *  tell e.g. 201 Created apart from 200 OK (an idempotent repeat). */
export async function apiRaw<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 204) {
    return { status: res.status, body: undefined as T };
  }

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return { status: res.status, body: body as T };
}
