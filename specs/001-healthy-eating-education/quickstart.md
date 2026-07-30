# Quickstart: Healthy Eating Education

## Prerequisites

- Node.js 24 LTS
- npm
- PostgreSQL 14+ (Render provides `DATABASE_URL` in production)
- A tablet or laptop with a webcam (for QR scan testing) — or use printed
  test QR codes generated in step 3 and hold them up to any camera

## Setup

```bash
# backend
cd backend
npm install

# Local development uses a dedicated database. Create it once, then set
# DATABASE_URL in your shell or local environment file.
createdb -h localhost -U postgres little_green_thumb_development
export DATABASE_URL=postgres://postgres:<password>@localhost:5432/little_green_thumb_development
npm run db:migrate   # applies schema.sql and idempotently seeds demo data
npm run dev           # starts Express API on :3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev           # starts Vite dev server on :5173, proxying /api to :3001
```

## First run walkthrough

1. Open `http://localhost:5173`.
2. Sign in as the seeded admin (`admin@example.com` / see seed output) and
   publish the seeded demo plant/recipe if not already published (FR-016).
3. Sign in as the seeded teacher, open Garden Setup, select the demo plant
   for the Garden Selection, and open the printable QR label page (FR-017) —
   note the plant's `qrCode` value or print/save the label to scan in step 5.
4. Still as the teacher, generate a parent quick-login code for the seeded
   student (`POST /parents/generate-code`).
5. Open the student picker (no login), select the seeded student, then open
   "Scan a Plant" and scan the label from step 3 (or paste its `qrCode`
   value in the dev-only manual-entry fallback). Confirm the two-choice
   fork appears (FR-001), open "Learn About This Plant" (confirms narration
   + offline caching once loaded), then go back and open "See Recipes."
6. Open the seeded recipe, step through it, and tap "Add to My Cookbook" at
   the end (FR-006). Open "My Cookbook," confirm the entry appears, filter/
   sort the list (FR-007), mark it "I made it," and rate it (FR-008) —
   confirm the rating control was hidden before marking it made.
7. Sign in as a new parent using the code from step 4 (`POST
   /auth/parent-code`), confirm you land on the linked student's discovered
   plants and Cookbook in a few taps (FR-011, FR-012), and add a second
   recipe to the child's Cookbook to confirm it appears identically in the
   student's own view.
8. As the teacher, open the class roster and confirm the student's
   Cookbook/discovery activity is visible (FR-009).
9. Go offline (dev tools → Network → Offline) and reload the plant/recipe
   pages and Cookbook already visited — content MUST still render (FR-020).
   Add another recipe to the Cookbook while offline, then go back online and
   confirm it syncs.

## Tests

```bash
# Tests use a dedicated PostgreSQL database and an isolated schema per test file.
createdb -h localhost -U postgres little_green_thumb_test
cd backend && TEST_DATABASE_URL=postgres://postgres:<password>@localhost:5432/little_green_thumb_test npm test
cd frontend && npm test   # Vitest + React Testing Library
```

## Deployment environment

Set `DATABASE_URL` to the PostgreSQL connection string supplied by Render and
set a strong `SESSION_SECRET`. The application creates its idempotent
application schema and PostgreSQL-backed session table on startup. Run
`npm run db:migrate` once against a new production database to add the demo
seed data; repeated runs leave existing seeded data unchanged. When connecting
from a local machine to Render's external database URL, append
`sslmode=require` to the URL query string.
