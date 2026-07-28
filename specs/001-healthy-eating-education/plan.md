# Implementation Plan: Healthy Eating Education

**Branch**: `001-healthy-eating-education` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-healthy-eating-education/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A tablet web app where a K-2 student scans a QR code on a garden plant,
chooses to learn about the plant or see its recipes, adds recipes to a
personal Cookbook, and later marks them "I made it" and rates them. Teachers
review/assist student Cookbooks and print QR labels for their garden;
parents get a fast, low-friction login to view/assist their child; a super
admin maintains the plant/recipe library and QR-to-plant mapping. Technical
approach is unchanged from the prior plan revision — a React + TypeScript
SPA (kid-facing, icon-first, touch-only UI) talking to a small Node/
TypeScript API backed by a single SQLite file — extended with in-browser QR
scanning and printable QR-label generation, still the smallest stack that
meets the constitution's offline-capable, low-end-device bar.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24 LTS (frontend and backend share one language/toolchain)
**Primary Dependencies**: React 18 + Vite (frontend build); Radix UI (unstyled, accessible primitives) as the component foundation, Emotion (`@emotion/styled`) as the single styling layer for both standard and bespoke kid-facing components; Express (minimal HTTP API); better-sqlite3 (synchronous SQLite driver); `qr-scanner` (in-browser camera QR decoding, uses the native BarcodeDetector API where available); `qrcode` (server-side QR label image generation for printing)
**Storage**: SQLite, single file (`data/app.db`), accessed via better-sqlite3; static media (images/audio, generated QR label images) served from disk, cached client-side via Service Worker + browser storage for offline viewing of previously loaded plants/recipes and the student's own Cookbook
**Testing**: Vitest for both frontend (+ React Testing Library) and backend (+ supertest) — one test runner, no second framework to maintain
**Target Platform**: Tablet web browsers (Chrome/Safari on iPad/Android tablets) with rear camera access for QR scanning; single self-hosted Node server per school/district (no cloud dependency required)
**Project Type**: web application (frontend + backend)
**Performance Goals**: Per constitution Principle IV — interactions respond within 100ms, screen transitions complete within 1s on low-end tablets; QR scan-to-recognition within 5s (SC-001)
**Constraints**: Offline-capable for previously loaded plant/recipe content and the student's own Cookbook (FR-020); touch-only interaction, no hover/right-click/fine-motor dependence (FR-014); 44x44px minimum tap targets and 3rd-grade-or-below reading level (Principle II); camera permission required only for QR scanning, with a non-blocking library-browse fallback if denied (FR-004)
**Scale/Scope**: Single classroom/school scale — tens of students per class, 12-15 plants with QR labels per garden (Assumptions), low tens of classes per deployment; a single SQLite file and single Node process comfortably cover this

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | TS strict mode, ESLint/Prettier, Vitest coverage per functional area (scan resolution, Cookbook filter/sort, publish-validation gate); no speculative abstractions (QR scanning and label generation are thin wrappers around one library each, no custom decoder/encoder) | PASS |
| II. Elementary Child Focus | Two-choice icon fork after scan, single-tap Cookbook add, "I made it" + 3-icon rating scale, no typed input anywhere in the student flow; friendly icon-based error on failed scan | PASS |
| III. UX Consistency | Same shared component library (Radix UI primitives styled once via Emotion, shared design tokens) extended to scan/Cookbook/rating screens — a single styling system (Emotion) instead of two, removing the prior split-styling risk entirely; scan fork and Cookbook reuse the same card/list patterns as the existing plant/recipe browse screens | PASS |
| IV. Performance Requirements | QR decoding runs client-side (no round trip to recognize a code); plant/recipe pages and the student's own Cookbook are cached for offline; label generation is an admin-side, non-blocking background action | PASS |

No violations — Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-healthy-eating-education/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── db/            # sqlite connection, schema.sql, migrations
│   ├── models/        # typed row accessors (Plant, Recipe, Student, Class, CookbookEntry, GardenSelection, User)
│   ├── routes/         # /auth, /plants, /recipes, /qr, /cookbook, /classes, /garden, /admin, /usage
│   ├── middleware/     # session auth + role guard (child/teacher/parent/admin)
│   └── services/      # QR label image generation (qrcode), activity-log writer, offline-sync merge logic
└── tests/
    ├── contract/       # per-route request/response contract tests
    ├── integration/    # role-flow tests (scan→fork→plant, add→made→rate, teacher assist, parent quick-login)
    └── unit/

frontend/
├── src/
│   ├── components/    # shared Radix UI primitives styled via Emotion, kid-facing playful components (Emotion keyframes/animation)
│   ├── pages/          # student/ (scan, plant, recipe, cookbook), teacher/, parent/, admin/ (library, garden-labels, usage)
│   ├── services/       # API client, QR camera decode (qr-scanner), offline cache (Service Worker + IndexedDB)
│   └── styles/          # Emotion theme/tokens (spacing, color, type scale) shared across roles for UX consistency
└── tests/
    ├── integration/    # screen-level flows per user story
    └── unit/
```

**Structure Decision**: Web application split (Option 2), unchanged from the
prior plan revision. QR scanning is a frontend-only concern (client-side
camera decode against a `plantQrCode` field returned with each Plant); QR
label generation is a backend concern (renders a printable image/PDF per
selected plant) — both fit inside the existing backend/frontend split with
no new project or service.

## Complexity Tracking

*No Constitution Check violations — table not applicable.*
