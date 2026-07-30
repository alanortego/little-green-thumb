# Phase 1 Data Model: Healthy Eating Education

PostgreSQL schema. IDs use generated integer identities, booleans use
`BOOLEAN`, and all lifecycle timestamps use `TIMESTAMPTZ`.

## users

Backs Teacher, Parent, and Super Admin roles (FR-022). Students are a
separate table (`students`) since they don't authenticate with credentials
(see Assumptions in spec.md).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| role | TEXT | one of `teacher`, `parent`, `admin` |
| name | TEXT | display name |
| email | TEXT UNIQUE, nullable | login identifier; null for parent-only accounts using a code |
| password_hash | TEXT, nullable | bcrypt hash; null for parent-code accounts |
| created_at | TIMESTAMPTZ | |

## classes

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | e.g., "Ms. Rivera's K class" |
| teacher_id | INTEGER FK → users.id | |
| created_at | TIMESTAMPTZ | |

## students

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| display_name | TEXT | first name / nickname shown on picker |
| avatar_key | TEXT | picker icon, no photo required |
| class_id | INTEGER FK → classes.id | one class at a time (Assumptions) |
| parent_id | INTEGER FK → users.id, nullable | set once parent uses their quick-login code |
| parent_quick_code | TEXT UNIQUE, nullable | short code a parent enters to link/login (FR-011) |
| created_at | TIMESTAMPTZ | |

## plants

Represents the "Plant" entity, tied to a QR code (FR-001, FR-002, FR-015, FR-016).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | |
| qr_code | TEXT UNIQUE | stable identifier encoded in the printed QR label (FR-018) |
| image_path | TEXT | required to publish |
| narration_audio_path | TEXT | required to publish |
| narration_script | TEXT | required to publish |
| benefit_text | TEXT | single sentence, required to publish |
| is_published | BOOLEAN | `false` = draft, `true` = published (FR-016 gate); only published plants are eligible for Garden Selection |
| created_by | INTEGER FK → users.id (admin) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## recipes

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | |
| image_path | TEXT | required to publish |
| is_published | BOOLEAN | |
| created_by | INTEGER FK → users.id (admin) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## recipe_steps

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| recipe_id | INTEGER FK → recipes.id | |
| step_order | INTEGER | 1-based, ordered |
| image_path | TEXT | required |
| narration_audio_path | TEXT | required |
| narration_script | TEXT | required |

## recipe_plants

Join table: which Plant entries a Recipe is linked to (many-to-many, FR-003).

| Column | Type | Notes |
|--------|------|-------|
| recipe_id | INTEGER FK → recipes.id | |
| plant_id | INTEGER FK → plants.id | |

## cookbook_entries

A Student's personal Cookbook (FR-006, FR-007, FR-008).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK → students.id | |
| recipe_id | INTEGER FK → recipes.id | |
| added_by | TEXT | `student`, `teacher`, or `parent` (who added it — supports FR-010/FR-012 assist) |
| is_made | BOOLEAN | "I made it" (FR-008) |
| made_at | TIMESTAMPTZ, nullable | |
| rating | INTEGER, nullable | 1-3, only settable once `is_made = 1` (FR-008) |
| rated_at | TIMESTAMPTZ, nullable | |
| created_at | TIMESTAMPTZ | |

Unique on (student_id, recipe_id) — prevents duplicate adds (FR-006).

## plant_discoveries

Tracks which Plants a Student has scanned/viewed, for the parent "discovered
plants" view (FR-012) and usage aggregation (FR-019).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK → students.id | |
| plant_id | INTEGER FK → plants.id | |
| first_scanned_at | TIMESTAMPTZ | |
| last_scanned_at | TIMESTAMPTZ | |

Unique on (student_id, plant_id) — one row per student/plant, timestamps
updated on repeat scans.

## garden_selections

Which Plants a given Class's garden physically has, used to generate
printable QR labels (FR-017, Garden Selection entity).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| class_id | INTEGER FK → classes.id | |
| plant_id | INTEGER FK → plants.id | |
| selected_by | INTEGER FK → users.id (teacher/admin) | |
| created_at | TIMESTAMPTZ | |

Unique on (class_id, plant_id).

## activity_log

Usage monitoring (FR-019, Super Admin dashboard).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| actor_type | TEXT | `student`, `teacher`, `parent`, `admin` |
| actor_id | INTEGER | student_id or users.id depending on actor_type |
| action | TEXT | e.g., `plant_scanned`, `recipe_added_to_cookbook`, `recipe_made`, `recipe_rated`, `plant_published`, `garden_labels_printed` |
| content_type | TEXT | nullable, `plant`/`recipe` when applicable |
| content_id | INTEGER | nullable |
| created_at | TIMESTAMPTZ | indexed for date-range queries (usage dashboard) |

## Relationships summary

- `classes.teacher_id` → `users.id` (role=teacher)
- `students.class_id` → `classes.id`; `students.parent_id` → `users.id` (role=parent)
- `recipe_plants` links `recipes` ↔ `plants` (many-to-many)
- `cookbook_entries` links `students` ↔ `recipes`, one row per pair, carries made/rating state
- `plant_discoveries` links `students` ↔ `plants` scanned, one row per pair
- `garden_selections` links `classes` ↔ `plants` chosen for physical QR labels
- `activity_log` references any actor for aggregate reporting, no hard FK
  needed since it's an append-only audit trail

## Removed from prior revision

The pre-QR/Cookbook `foods`, `assignments`, and `progress_records` tables are
superseded: `foods` → `plants` (renamed, gains `qr_code`); `assignments`
(teacher pushes content to a whole class) is replaced by the Cookbook model,
where content is per-student and either self-added or assist-added by a
teacher/parent (`cookbook_entries.added_by`); `progress_records`
(viewed/completed) is replaced by `plant_discoveries` (scan tracking) and
`cookbook_entries` (added/made/rated tracking), which better match the
scan-first, Cookbook-centric flow.
