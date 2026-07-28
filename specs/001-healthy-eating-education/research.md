# Phase 0 Research: Healthy Eating Education

The user supplied the core stack directly (React/TS/Vite, SQLite,
database-role auth, local storage, in-app admin form, activity log table),
then extended the feature with QR-code garden scanning, a student Cookbook,
teacher/parent assist flows, and printable QR labels, and later swapped the
UI layer from shadcn/ui + Styled Components to Radix UI + Emotion. Decisions
below fill the gaps needed to implement all of that consistently and in line
with the constitution.

## SQLite driver

- **Decision**: `better-sqlite3`
- **Rationale**: Synchronous API keeps request handlers simple (no async/await
  ceremony for a single-file local DB), battle-tested, zero external service
  to run or monitor — matches the "simple database auth"/single-file-storage
  spirit of the requested stack.
- **Alternatives considered**: `node:sqlite` (Node's built-in driver) — still
  experimental as of Node 24 LTS, risk not worth it for a school-deployed app;
  `sql.js` (WASM, in-browser) — would mean no server-side source of truth for
  multi-device/teacher-dashboard use cases, rejected.

## Backend framework

- **Decision**: Express
- **Rationale**: Minimal, well-known, no build step of its own, easy to add a
  small role-guard middleware. The app needs a handful of REST-ish routes
  (including QR-label image generation), not a framework's worth of features.
- **Alternatives considered**: Fastify (faster, but the app's scale — tens of
  students per class — doesn't need the throughput); a framework-less
  `node:http` server (rejected: would mean hand-rolling routing/body-parsing
  that Express already provides for free).

## QR code scanning (student)

- **Decision**: `qr-scanner` (npm package), which prefers the browser-native
  `BarcodeDetector` API and falls back to a WASM decoder when unavailable.
- **Rationale**: Decoding happens entirely client-side against the tablet's
  camera stream — no round trip needed to "recognize" a code (supports
  SC-001's 5-second budget and Principle IV's no-blocking-network-call bar).
  Each Plant simply carries a stable `qrCode` string; the client decodes the
  camera frame to a string and looks up the matching Plant via the existing
  `GET /plants?qrCode=` route.
- **Alternatives considered**: A server-side image-upload-and-decode flow —
  rejected, adds a network round trip and a photo-capture step, working
  against the "fewest possible steps" child-experience requirement (FR-013);
  hand-rolling a decoder — rejected, reinvents a solved, well-tested problem.

## QR label generation (teacher/admin garden setup)

- **Decision**: `qrcode` (npm package) on the backend, rendering each
  selected Plant's `qrCode` string to a PNG/SVG, laid out on a simple
  printable HTML page (browser print-to-PDF) for the "Garden Selection" flow
  (FR-017).
- **Rationale**: One well-known library generates the code image; no need for
  a PDF-generation dependency since the browser's own print dialog covers
  "printable sheet" — matches the app's server-render-a-page-then-print
  simplicity elsewhere (avoids adding a PDF library for a one-off admin
  screen).
- **Alternatives considered**: A dedicated PDF library (e.g., pdfkit) —
  rejected as an extra dependency for a need the browser's print-to-PDF
  already covers; a third-party QR/label SaaS — rejected, adds an external
  dependency and network requirement to an otherwise self-hosted app.

## Auth & sessions (including parent quick-login)

- **Decision**: Server-side session (signed cookie, `express-session` with a
  SQLite-backed store) for all four roles, but with two different login
  entry points sharing the same session mechanism underneath:
  - Teacher/Admin: email + password (`POST /auth/login`).
  - Parent: a short join/quick-login code tied to their linked student(s)
    (`POST /auth/parent-code`) — meaningfully fewer steps than a typed
    email/password, per FR-011.
  - Student ("child"): no credentials at all — a teacher/parent-assisted
    picker starts a session directly for the selected Student record
    (`POST /auth/select-student`), per FR-013.
- **Rationale**: The user asked for "simple database auth" for the base case
  and, later, "extremely simple" child login and a "quick" parent login.
  One session mechanism with three login *entry points* (rather than three
  separate auth systems) keeps the server-side logic single-path while still
  meeting each role's step-count requirement. Sessions also avoid the
  complexity of token refresh/rotation that JWTs would add for no benefit at
  this scale.
- **Alternatives considered**: JWT — rejected as unnecessary complexity for a
  single-server, cookie-capable web app (YAGNI); a separate "parent auth
  service" — rejected, the same `users` table with `role='parent'` plus a
  short-lived code column covers it without new infrastructure.

## Styling: Radix UI + Emotion

- **Decision** (supersedes prior shadcn/ui + Tailwind + Styled Components
  choice): Radix UI provides unstyled, accessible component primitives
  (dialogs, tabs, radio groups for the rating scale, etc.); Emotion's
  `@emotion/styled` is the single styling layer for everything — both
  standard UI (forms, dashboards, lists, the Cookbook grid) and the bespoke,
  animated kid-facing components (recipe-completion celebration, scan
  two-choice fork reveal, "I made it" rating faces), using Emotion's
  `keyframes`/`css` helpers for animation.
- **Rationale**: One styling system instead of two removes the
  boundary-enforcement concern the prior Tailwind/Styled-Components split
  required (Principle III, UX Consistency) — there's no second system to
  keep scoped or drift out of sync. Radix UI's primitives are unstyled by
  design, so they compose directly with Emotion's `styled()` API without a
  Tailwind utility layer in between.
- **Alternatives considered**: Radix UI + Tailwind — rejected, user chose
  Emotion specifically; keeping Tailwind as a second layer alongside Emotion
  — rejected as the same two-systems risk this change was meant to remove.

## Shared design tokens

- **Decision**: A single Emotion theme object (`ThemeProvider`) holds color,
  spacing, and type-scale tokens, consumed by every `styled()` component
  across student/teacher/parent/admin screens.
- **Rationale**: Principle III requires identical navigation patterns,
  iconography, and color meaning across every screen; a shared theme object
  is Emotion's standard mechanism for enforcing one source of truth for
  those tokens, replacing the role Tailwind's config previously played.
- **Alternatives considered**: Per-component hard-coded values — rejected,
  the fastest way to reintroduce the inconsistency Principle III forbids.

## Offline caching for student content and Cookbook

- **Decision**: Service Worker (Vite PWA plugin) caching plant/recipe media +
  API responses already viewed, plus the student's own Cookbook data,
  falling back to cache when offline; Cookbook writes (add, "I made it",
  rating) queue in IndexedDB and flush on reconnect.
- **Rationale**: FR-020 and constitution Principle IV require offline
  viewing of previously loaded content (now including the Cookbook) and no
  blocking network calls — a Service Worker is the standard browser-native
  mechanism, no extra dependency needed. QR scanning itself doesn't need
  network access once a plant's data is cached (decode is local; lookup
  falls back to cached plant list when offline).
- **Alternatives considered**: A native app shell (Capacitor/Electron) —
  rejected, adds a build target and packaging burden the spec doesn't ask for;
  plain in-memory cache — rejected, doesn't survive app reload/offline start.

## Testing framework

- **Decision**: Vitest (+ React Testing Library for frontend, + supertest for
  backend route contract tests).
- **Rationale**: One test runner for both TypeScript projects (frontend and
  backend), Vite-native, no separate Jest config/transform pipeline to
  maintain. QR decode/label-generation logic is tested by mocking the
  respective library's output rather than driving a real camera in CI.
- **Alternatives considered**: Jest — works fine but duplicates what Vitest
  already gives the Vite-based frontend for free; picking one avoids running
  two test runners in CI.
