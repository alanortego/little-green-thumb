# API Contracts: Healthy Eating Education

REST-ish JSON API served by the Express backend. Session cookie (from
`POST /auth/login`, `/auth/parent-code`, or `/auth/select-student`) required
on all routes except `/auth/*`. Role guard middleware enforces the "Role"
column below.

| Method & Path | Role | Purpose | Success | Key Errors |
|---|---|---|---|---|
| `POST /auth/login` | public | Teacher/Admin email+password login | 200 + session cookie | 401 invalid credentials |
| `POST /auth/parent-code` | public | Parent quick login via short code (FR-011); each code links exactly one child. If called while already signed in as a parent, links this additional child to the same parent account instead of starting a new session | 200 + session cookie, active student | 400 invalid/expired code |
| `GET /parents/me/students` | parent | List all children linked to the signed-in parent account (FR-011a) | 200 `Student[]` | 403 |
| `POST /parents/select-student` | parent | Switch which linked child is active in the current session, no re-login (FR-011a) | 200 `{activeStudentId}` | 403, 404 unknown/unlinked student |
| `POST /auth/select-student` | teacher/parent (assisted) | Start a Student session via picker, no password (FR-013) | 200 + session cookie | 404 unknown student |
| `POST /auth/logout` | any | End session (also triggered by the always-visible "Switch Student" control, FR-013a) | 204 | — |
| `GET /plants` | any authenticated | List published plants (student/teacher/parent); admin sees drafts too via `?includeDrafts=1` | 200 `Plant[]` | — |
| `GET /plants/:id` | any authenticated | Plant benefit page detail | 200 `Plant` | 404 |
| `GET /plants/by-qr/:qrCode` | student session | Resolve a scanned QR code to its Plant (FR-001); also records a `plant_discoveries` row | 200 `Plant` | 404 unrecognized code → friendly "not found" for scan-retry/browse fallback |
| `POST /plants` | admin | Create draft plant entry (incl. `qrCode`) | 201 `Plant` | 400 validation, 409 duplicate qrCode |
| `PUT /plants/:id` | admin | Edit plant entry | 200 `Plant` | 400, 404 |
| `POST /plants/:id/publish` | admin | Publish (FR-016 gate: blocks if required fields missing) | 200 `Plant` | 422 `{missingFields: string[]}` |
| `GET /plants/:id/recipes` | any authenticated | Recipes linked to a plant (the "See Recipes" pathway, FR-003) | 200 `Recipe[]` | 404 |
| `GET /recipes/:id` | any authenticated | Recipe detail with ordered steps | 200 `Recipe` | 404 |
| `POST /recipes` | admin | Create draft recipe (with steps, linked plant ids) | 201 `Recipe` | 400 |
| `PUT /recipes/:id` | admin | Edit recipe/steps | 200 `Recipe` | 400, 404 |
| `POST /recipes/:id/publish` | admin | Publish (blocks on missing step fields) | 200 `Recipe` | 422 `{missingFields: string[]}` |
| `GET /students/:id/cookbook` | student (self) / teacher (own class) / parent (own child) | List a student's Cookbook entries, with filter/sort query params (`?filterPlantId=&filterMade=&sort=`) (FR-007) | 200 `CookbookEntry[]` | 403, 404 |
| `POST /students/:id/cookbook` | student (self) / teacher (own class, assist) / parent (own child, assist) | Add a recipe to a student's Cookbook (FR-006, FR-010, FR-012); idempotent — repeat add returns the existing entry, not a duplicate | 200/201 `CookbookEntry` | 400, 403, 404 |
| `POST /cookbook/:entryId/made` | student (self) / teacher (assist) / parent (assist) | Mark a Cookbook entry "I made it" (FR-008) | 200 `CookbookEntry` | 403, 404 |
| `POST /cookbook/:entryId/rating` | student (self) / teacher (assist) / parent (assist) | Rate a Cookbook entry, 1-3; requires `is_made = true` first | 200 `CookbookEntry` | 400 not yet made, 403, 404 |
| `GET /students/:id/discoveries` | student (self) / teacher (own class) / parent (own child) | Plants a student has scanned (FR-012) | 200 `PlantDiscovery[]` | 403, 404 |
| `GET /classes/:id/students` | teacher (own class) | Roster with each student's Cookbook/discovery summary (FR-009) | 200 `{student, cookbookCount, madeCount, plantsDiscovered}[]` | 403, 404 |
| `GET /classes/:id/garden-selection` | teacher/admin (own class) | Current Garden Selection for a class (FR-017) | 200 `Plant[]` | 403, 404 |
| `PUT /classes/:id/garden-selection` | teacher/admin (own class) | Replace the set of selected plants for the garden | 200 `Plant[]` | 400 empty selection, 403 |
| `GET /classes/:id/garden-labels.pdf` | teacher/admin (own class) | Printable QR label sheet for the current Garden Selection (FR-017) | 200 `application/pdf` (browser print-to-PDF of a generated HTML label page) | 404 empty selection |
| `POST /parents/generate-code` | teacher (own class) | Issue/regenerate a student's `parent_quick_code` | 200 `{code}` | 403, 404 |
| `GET /admin/usage?from=&to=` | admin | Aggregate scan/add/made counts in date range (FR-019) | 200 `{plantsScanned, recipesAdded, recipesMade, ...}` | 400 invalid range |

## Shared error shape

```json
{ "error": "human_readable_message", "missingFields": ["narration_audio_path"] }
```

`missingFields` only present on 422 publish-validation errors (FR-016).

## Offline behavior contract

- `GET /plants`, `GET /plants/:id`, `GET /plants/:id/recipes`,
  `GET /recipes/:id`, and `GET /students/:id/cookbook` (for the
  logged-in student) responses, plus referenced media, are cached
  client-side (Service Worker) after first successful fetch; served from
  cache when offline (FR-020).
- `GET /plants/by-qr/:qrCode` falls back to a client-side lookup against the
  already-cached `GET /plants` list when offline, so a previously-loaded
  plant's QR code still resolves without a network call.
- `POST /students/:id/cookbook`, `POST /cookbook/:entryId/made`, and
  `POST /cookbook/:entryId/rating` queue in IndexedDB when offline and
  replay in order once connectivity returns; server treats replayed
  timestamps as authoritative client-recorded time, not server receipt time.

## Session behavior contract

- A student session ends on the earlier of: the "Switch Student" control
  being tapped (`POST /auth/logout`), or 30 minutes with no request/touch
  activity (FR-013a). The server tracks `lastActivityAt` on the session and
  rejects requests past the idle window with a 401, prompting the client
  back to the student picker.
- Idle-timeout applies only to student sessions; teacher/parent/admin
  sessions use standard cookie expiry (no special idle rule required by
  this spec).

