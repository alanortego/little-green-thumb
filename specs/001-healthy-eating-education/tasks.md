---

description: "Task list for Healthy Eating Education (QR garden scan + student Cookbook)"

---

# Tasks: Healthy Eating Education

**Input**: Design documents from `/specs/001-healthy-eating-education/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Not explicitly requested in spec.md; no test tasks included. Add a
`tests/` phase later if TDD is requested.

**Organization**: Tasks are grouped by user story (spec.md priorities) so each
story is independently implementable, testable, and deployable as an
increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to spec.md user stories (US1-US7)

## Path Conventions

Web app split per plan.md: `backend/src/`, `backend/tests/`, `frontend/src/`,
`frontend/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create `backend/` and `frontend/` project skeletons per plan.md Project Structure (package.json, tsconfig, Vite config)
- [X] T002 Initialize backend with Express, better-sqlite3, express-session dependencies in `backend/package.json`
- [X] T003 Initialize frontend with React, Vite, Radix UI, Emotion, `qr-scanner` dependencies in `frontend/package.json`
- [X] T004 [P] Configure ESLint + Prettier (shared config) for both `backend/` and `frontend/`
- [X] T005 [P] Configure Vitest for backend (`backend/vitest.config.ts`) and frontend (`frontend/vitest.config.ts`)

**Checkpoint**: Both projects install and run a "hello world" dev server.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create SQLite schema in `backend/src/db/schema.sql` for all tables in data-model.md (users, classes, students, plants, recipes, recipe_steps, recipe_plants, cookbook_entries, plant_discoveries, garden_selections, activity_log)
- [X] T007 Create db connection + migration runner in `backend/src/db/connection.ts`
- [X] T008 [P] Create typed row models in `backend/src/models/` (User, Class, Student, Plant, Recipe, RecipeStep, CookbookEntry, PlantDiscovery, GardenSelection)
- [X] T009 Implement session middleware (`express-session` + SQLite store) in `backend/src/middleware/session.ts`, tracking `lastActivityAt` for idle-timeout support (FR-013a)
- [X] T010 Implement role-guard middleware in `backend/src/middleware/roleGuard.ts` (child/teacher/parent/admin per contracts/api.md)
- [X] T011 Implement student idle-timeout enforcement (30 min, FR-013a) in `backend/src/middleware/idleTimeout.ts`, applied only to student sessions, rejecting stale requests with 401
- [X] T012 [P] Implement activity-log writer service in `backend/src/services/activityLog.ts` (FR-019)
- [X] T013 `POST /auth/login`, `POST /auth/logout` routes in `backend/src/routes/auth.ts`
- [X] T014 [P] Set up frontend routing shell (`frontend/src/App.tsx`) with role-based route groups: student/, teacher/, parent/, admin/
- [X] T015 [P] Create Emotion theme/tokens (spacing, color, type scale) in `frontend/src/styles/theme.ts` and wrap app in `ThemeProvider`
- [X] T016 [P] Build shared Radix UI + Emotion primitives (Button, Card, IconButton with 44x44px min tap target) in `frontend/src/components/`
- [X] T017 Build always-visible "Switch Student" control component in `frontend/src/components/SwitchStudentControl.tsx`, rendered on every student-facing screen, calling `POST /auth/logout` (FR-013a)
- [X] T018 Wire client-side idle-timer (30 min no touch) in `frontend/src/services/idleTimer.ts` that triggers logout + redirect to student picker on expiry (FR-013a)

**Checkpoint**: Auth/session/idle-timeout, DB schema, and shared UI shell are ready — user story work can begin.

---

## Phase 3: User Story 1 - Student Scans a Garden QR Code to Learn About a Plant (Priority: P1) 🎯 MVP

**Goal**: Student scans a QR code, gets a two-choice fork, and can view a plant's benefit page (with offline fallback).

**Independent Test**: Scan one pre-loaded plant's QR code (or open it from a browsable list offline) and reach the two-choice fork and benefit page.

- [X] T019 [P] [US1] `GET /plants`, `GET /plants/:id`, `GET /plants/by-qr/:qrCode` routes in `backend/src/routes/plants.ts` (by-qr also records a `plant_discoveries` row)
- [X] T020 [US1] `POST /auth/select-student` route in `backend/src/routes/auth.ts` (student picker login, FR-013)
- [X] T021 [US1] Student picker/login screen (avatar tap, no typed input) in `frontend/src/pages/student/StudentPicker.tsx`
- [X] T022 [US1] QR camera-scan screen using `qr-scanner` (native BarcodeDetector preferred) in `frontend/src/pages/student/ScanScreen.tsx`
- [X] T023 [US1] Two-choice fork screen ("Learn About This Plant" / "See Recipes") in `frontend/src/pages/student/PlantFork.tsx`
- [X] T024 [US1] Plant benefit page (picture, narrated audio, one benefit sentence, replay + back icons) in `frontend/src/pages/student/PlantBenefit.tsx`
- [X] T025 [US1] Friendly unrecognized-QR error screen with retry/browse-library options in `frontend/src/pages/student/ScanNotFound.tsx`
- [X] T026 [US1] Plant library browse list (indoor/offline entry point) in `frontend/src/pages/student/PlantLibrary.tsx`
- [X] T027 [US1] Client-side Service Worker caching of `GET /plants`, `GET /plants/:id`, and media for offline plant viewing in `frontend/src/services/offlineCache.ts` (FR-020)
- [X] T028 [US1] Offline QR resolution fallback: match scanned code against cached `GET /plants` list when network fails, in `frontend/src/services/qrResolve.ts`
- [X] T029 [US1] Rapid-tap narration-interrupt handling (stop previous audio, start new) in shared narration player `frontend/src/components/NarrationPlayer.tsx`

**Checkpoint**: User Story 1 fully functional and independently testable (scan → fork → plant page, with offline + error handling).

---

## Phase 4: User Story 2 - Student Follows a Recipe from a Scanned Plant (Priority: P1)

**Goal**: Student reaches a plant's recipes, opens one, and steps through instructions to completion.

**Independent Test**: From scan or browse, open a plant's recipe list, open a recipe, and step through all instructions.

- [X] T030 [P] [US2] `GET /plants/:id/recipes`, `GET /recipes/:id` routes in `backend/src/routes/recipes.ts`
- [X] T031 [US2] Recipe list screen (per plant, picture + name cards) in `frontend/src/pages/student/RecipeList.tsx`
- [X] T032 [US2] Recipe step-through screen (one picture + narration + "next" per step) in `frontend/src/pages/student/RecipeSteps.tsx`
- [X] T033 [US2] Completion celebration screen with "Add to My Cookbook" button in `frontend/src/pages/student/RecipeComplete.tsx`
- [X] T034 [US2] Extend Service Worker caching to `GET /plants/:id/recipes` and `GET /recipes/:id` for offline recipe viewing in `frontend/src/services/offlineCache.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently (scan/browse → recipe → step-through → completion).

---

## Phase 5: User Story 3 - Student Builds and Manages Their Cookbook (Priority: P1)

**Goal**: Student adds recipes to a personal Cookbook, browses/filters/sorts it, marks "I made it," and rates.

**Independent Test**: Add a recipe to Cookbook, reopen it, filter/sort, mark "I made it," and rate — with one student account only.

- [X] T035 [P] [US3] `POST /students/:id/cookbook` route (idempotent add, FR-006) in `backend/src/routes/cookbook.ts`
- [X] T036 [P] [US3] `GET /students/:id/cookbook` route with `filterPlantId`/`filterMade`/`sort` query params (FR-007) in `backend/src/routes/cookbook.ts`
- [X] T037 [US3] `POST /cookbook/:entryId/made` route (FR-008) in `backend/src/routes/cookbook.ts`
- [X] T038 [US3] `POST /cookbook/:entryId/rating` route (1-3, requires `is_made`, FR-008) in `backend/src/routes/cookbook.ts`
- [X] T039 [US3] "Add to My Cookbook" action + duplicate-add guard ("Already in your Cookbook") wired into `frontend/src/pages/student/RecipeComplete.tsx` and `RecipeSteps.tsx`
- [X] T040 [US3] Cookbook list screen with filter (plant, made/not-made) and sort (newest, alphabetical, rating) controls in `frontend/src/pages/student/Cookbook.tsx`
- [X] T041 [US3] Cookbook entry detail with "I made it!" action and 3-icon rating scale (rating hidden until made) in `frontend/src/pages/student/CookbookEntryDetail.tsx`
- [X] T042 [US3] IndexedDB offline queue + replay for cookbook add/made/rating actions when offline (FR-020) in `frontend/src/services/offlineQueue.ts`

**Checkpoint**: User Stories 1-3 complete the full core student loop (scan → learn/recipe → Cookbook → made/rate), independently testable end to end.

---

## Phase 6: User Story 4 - Teacher Reviews Student Activity and Assists with Cookbooks (Priority: P2)

**Goal**: Teacher signs in, reviews the plant/recipe library, views a student's Cookbook, and can add a recipe to it on the student's behalf.

**Independent Test**: Teacher logs in, views a roster with Cookbook activity, and adds a recipe to a specific student's Cookbook.

- [X] T043 [P] [US4] `GET /classes/:id/students` roster route (cookbookCount, madeCount, plantsDiscovered per FR-009) in `backend/src/routes/classes.ts`
- [X] T044 [US4] Extend `POST /students/:id/cookbook` and `/made`/`/rating` routes to allow teacher-role assist with `added_by=teacher` (own class only) in `backend/src/routes/cookbook.ts`
- [X] T045 [US4] Teacher login screen (email + password) in `frontend/src/pages/teacher/Login.tsx`
- [X] T046 [US4] Class roster screen (per-student Cookbook summary) in `frontend/src/pages/teacher/Roster.tsx`
- [X] T047 [US4] Student profile view for teacher (full Cookbook: added/made/rated) reusing `CookbookEntryDetail` in `frontend/src/pages/teacher/StudentProfile.tsx`
- [X] T048 [US4] "Add to [Student]'s Cookbook" assist action in `frontend/src/pages/teacher/StudentProfile.tsx`
- [X] T049 [US4] Teacher-facing plant/recipe library browse (read-only) reusing `PlantLibrary`/`RecipeList` in `frontend/src/pages/teacher/Library.tsx`

**Checkpoint**: Teacher can review and assist independently of parent/super-admin features.

---

## Phase 7: User Story 5 - Parent Quick-Login to Assist Child's Cookbook (Priority: P2)

**Goal**: Parent logs in with a short code, views/assists their child's Cookbook and discoveries, and — per clarification — picks between multiple linked children without re-logging in.

**Independent Test**: Complete quick login, view linked child's discoveries/Cookbook, add a recipe; with a second linked child, switch between children via the picker.

- [X] T050 [P] [US5] `POST /auth/parent-code` route — creates/reuses parent session and links the code's child; if already signed in as parent, links an additional child instead of starting a new session (FR-011) in `backend/src/routes/auth.ts`
- [X] T051 [P] [US5] `GET /students/:id/discoveries` route (FR-012) in `backend/src/routes/students.ts`
- [X] T052 [US5] `GET /parents/me/students` route listing all children linked to the signed-in parent (FR-011a) in `backend/src/routes/parents.ts`
- [X] T053 [US5] `POST /parents/select-student` route switching the active child in-session, no re-login (FR-011a) in `backend/src/routes/parents.ts`
- [X] T054 [US5] Extend cookbook routes to allow parent-role assist with `added_by=parent` (own linked child only) in `backend/src/routes/cookbook.ts`
- [X] T055 [US5] Parent quick-code entry screen in `frontend/src/pages/parent/QuickLogin.tsx`
- [X] T056 [US5] Parent child-picker screen (shown when >1 linked child, FR-011a) in `frontend/src/pages/parent/ChildPicker.tsx`
- [X] T057 [US5] Parent dashboard: active child's discovered plants + full Cookbook, reusing `Cookbook`/`CookbookEntryDetail` components, in `frontend/src/pages/parent/ChildDashboard.tsx`
- [X] T058 [US5] "Link another child" entry point (re-enter a code while signed in) in `frontend/src/pages/parent/ChildDashboard.tsx`

**Checkpoint**: Parent flow — including the multi-child picker from the clarification — works independently of teacher/admin features.

---

## Phase 8: User Story 6 - Super Admin Builds the Plant and Recipe Library (Priority: P3)

**Goal**: Super admin creates/edits/publishes Plant and Recipe entries and views a usage dashboard.

**Independent Test**: Create a plant/recipe entry with all required fields, publish it, and see it appear in the student-facing library.

- [X] T059 [P] [US6] `POST /plants`, `PUT /plants/:id`, `POST /plants/:id/publish` routes (FR-015, FR-016 field-gate) in `backend/src/routes/plants.ts`
- [X] T060 [P] [US6] `POST /recipes`, `PUT /recipes/:id`, `POST /recipes/:id/publish` routes (with steps + linked plant ids, FR-015, FR-016) in `backend/src/routes/recipes.ts`
- [X] T061 [US6] `GET /admin/usage?from=&to=` aggregate route (FR-019) in `backend/src/routes/admin.ts`
- [X] T062 [US6] Admin login (shares teacher/admin credential login) route reuse from T013
- [X] T063 [US6] Plant editor form (with publish-validation error display naming missing fields) in `frontend/src/pages/admin/PlantEditor.tsx`
- [X] T064 [US6] Recipe editor form (ordered steps, linked plants, publish-validation) in `frontend/src/pages/admin/RecipeEditor.tsx`
- [X] T065 [US6] Usage dashboard (date-range filter, aggregate counts) in `frontend/src/pages/admin/UsageDashboard.tsx`

**Checkpoint**: Super admin can independently manage the library and view usage.

---

## Phase 9: User Story 7 - Teacher/Admin Selects Garden Plants and Prints QR Labels (Priority: P3)

**Goal**: Teacher/admin selects which published plants are physically in their garden and generates a printable QR label sheet.

**Independent Test**: Select a subset of the plant library and produce a printable QR label sheet; a printed label resolves to the correct plant when scanned (US1).

- [X] T066 [P] [US7] `GET /classes/:id/garden-selection`, `PUT /classes/:id/garden-selection` routes (FR-017) in `backend/src/routes/garden.ts`
- [X] T067 [US7] QR label image generation service using `qrcode` (encodes each plant's `qr_code`) in `backend/src/services/qrLabelGenerator.ts`
- [X] T068 [US7] `GET /classes/:id/garden-labels.pdf` route rendering a printable HTML label sheet for the current Garden Selection (FR-017) in `backend/src/routes/garden.ts`
- [X] T069 [US7] Garden setup screen (checklist of full plant library, empty-selection print-disable per Edge Cases) in `frontend/src/pages/teacher/GardenSetup.tsx`
- [X] T070 [US7] "Print QR labels" action (opens label sheet in new tab for browser print-to-PDF) in `frontend/src/pages/teacher/GardenSetup.tsx`

**Checkpoint**: All 7 user stories independently functional; garden labels printed here scan correctly via US1.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T071 [P] Add `POST /parents/generate-code` route (issue/regenerate a student's `parent_quick_code`) in `backend/src/routes/parents.ts`
- [X] T072 [P] Enforce 3rd-grade-reading-level + narrated-audio pairing on all student-facing copy (content review pass) per FR-021
- [X] T073 [P] Enforce 44x44px minimum tap targets and touch-only interaction (no hover/right-click dependence) audit across `frontend/src/pages/student/`
- [X] T074 Add publish-validation missing-field messaging polish across `PlantEditor`/`RecipeEditor` (422 `missingFields` handling)
- [X] T075 [P] One runnable check per non-trivial logic path: idle-timeout expiry, Cookbook duplicate-add guard, rating-requires-made guard, QR offline-resolution fallback, multi-child picker switch (e.g. `backend/tests/unit/*.test.ts`, minimal Vitest assertions, no framework scaffolding)
- [X] T076 Run `quickstart.md` validation end to end on a tablet browser (touch + camera)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (schema, auth/session/idle-timeout, shared UI shell all live here since every story touches them).
- **User Stories (Phase 3-9)**: All depend on Foundational. P1 stories (US1-US3) build the core student loop and should land first; US4/US5 (P2) and US6/US7 (P3) can proceed in parallel afterward, or in priority order with one team.
- **Polish (Phase 10)**: Depends on the user stories it touches being complete.

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — first vertical slice.
- **US2 (P1)**: Builds on US1's plant records but is a separate route/screen set; independently testable via direct browse.
- **US3 (P1)**: Builds on US2's recipe completion screen for the "Add to Cookbook" entry point, but Cookbook CRUD/list/filter is independently testable once one recipe exists.
- **US4 (P2)**: Reads/writes the same Cookbook routes as US3 (assist mode) — needs US3's cookbook routes in place; independently testable with a teacher account only.
- **US5 (P2)**: Same relationship as US4 but for parents; independently testable with a parent account only. FR-011a picker has no dependency on US4.
- **US6 (P3)**: Independent — only needs Foundational (plants/recipes tables). Can be built before US1-US5 if content-authoring is prioritized, but is P3 because a pre-loaded library unblocks students first.
- **US7 (P3)**: Depends on US6's published plants existing (or seed data) to select from; validated end-to-end against US1's scan resolution.

### Within Each User Story

- Backend routes before frontend screens that call them.
- Shared components (`Cookbook`, `CookbookEntryDetail`, `PlantLibrary`) built once in US1-US3, reused (not re-implemented) by US4/US5.
- Story complete before moving to the next priority, unless staffed in parallel.

### Parallel Opportunities

- All Setup tasks marked [P] run in parallel.
- Foundational tasks T008, T012, T014, T015, T016 marked [P] run in parallel (independent files).
- Once Foundational completes, US1-US3 (P1) should be built first in sequence (they share the student flow); US4-US7 can then proceed in parallel across developers.
- Route tasks marked [P] within a story (different route files) run in parallel.

---

## Parallel Example: User Story 1

```bash
# Backend routes (different concerns, same file — sequence within file, parallel across files):
Task: "GET /plants, /plants/:id, /plants/by-qr/:qrCode routes in backend/src/routes/plants.ts"
Task: "POST /auth/select-student route in backend/src/routes/auth.ts"

# Frontend screens (different files, parallelizable once routes exist):
Task: "QR camera-scan screen in frontend/src/pages/student/ScanScreen.tsx"
Task: "Plant library browse list in frontend/src/pages/student/PlantLibrary.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phases 3-5: US1 → US2 → US3 (the full core student scan-to-Cookbook loop)
4. **STOP and VALIDATE**: Run quickstart.md steps 1-4 (scan → fork → recipe → Cookbook) on a tablet
5. Deploy/demo — this is the smallest slice that delivers the product's core value

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → US2 → US3 → core student loop (MVP)
3. US4 (teacher) and US5 (parent, incl. multi-child picker) → classroom/home visibility
4. US6 (content library) and US7 (QR label printing) → operational setup, can precede or follow US4/US5 depending on rollout needs (a real deployment likely needs US6+US7 before real students use US1, but can be seeded with fixture data for earlier testing)
5. Polish

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. One developer drives US1→US2→US3 in sequence (shared student-flow files).
3. Once US3's Cookbook routes exist, a second developer can start US4, a third US5, in parallel.
4. US6/US7 can be picked up by any available developer as soon as Foundational is done (only needs plants/recipes/garden_selections tables).

---

## Notes

- [P] tasks touch different files with no unmet dependencies.
- [Story] label maps each task to its spec.md user story for traceability.
- No test-first tasks included (not requested); Phase 10 T075 adds one minimal
  runnable check per non-trivial logic path instead of a full test suite.
- Commit after each task or logical group; stop at any checkpoint to validate
  a story independently before continuing.
- Reuse shared components (`Cookbook`, `PlantLibrary`, `NarrationPlayer`)
  across student/teacher/parent screens — do not re-implement per role.
