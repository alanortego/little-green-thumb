export const STUDENT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // FR-013a, mirrors backend/src/middleware/idleTimeout.ts

const ACTIVITY_EVENTS = ['touchstart', 'pointerdown', 'keydown'] as const;

/**
 * Client-side companion to the backend's idle-timeout enforcement
 * (FR-013a). This is a UX nicety — it redirects the student to the picker
 * the moment 30 minutes pass locally, instead of waiting for their next
 * API call to bounce with 401. The backend remains the source of truth.
 *
 * Returns a cleanup function; call it when leaving the student flow.
 */
export function startIdleTimer(onIdle: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;

  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(onIdle, STUDENT_IDLE_TIMEOUT_MS);
  };

  ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset));
  reset();

  return () => {
    clearTimeout(timer);
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
  };
}
