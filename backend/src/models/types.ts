// Row shapes matching backend/src/db/schema.sql (data-model.md).
// ponytail: plain interfaces, no ORM — better-sqlite3 rows are already
// plain objects, a class-per-entity layer would add nothing here.

export interface UserRow {
  id: number;
  role: 'teacher' | 'parent' | 'admin';
  name: string;
  email: string | null;
  password_hash: string | null;
  created_at: string;
}

export interface ClassRow {
  id: number;
  name: string;
  teacher_id: number;
  created_at: string;
}

export interface StudentRow {
  id: number;
  display_name: string;
  avatar_key: string;
  class_id: number;
  parent_id: number | null;
  parent_quick_code: string | null;
  created_at: string;
}

export interface PlantRow {
  id: number;
  name: string;
  qr_code: string;
  image_path: string | null;
  benefit_text: string | null;
  is_published: 0 | 1;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeRow {
  id: number;
  name: string;
  image_path: string | null;
  is_published: 0 | 1;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeStepRow {
  id: number;
  recipe_id: number;
  step_order: number;
  image_path: string | null;
  step_text: string | null;
}

export interface RecipePlantRow {
  recipe_id: number;
  plant_id: number;
}

export type AddedBy = 'student' | 'teacher' | 'parent';

export interface CookbookEntryRow {
  id: number;
  student_id: number;
  recipe_id: number;
  added_by: AddedBy;
  is_made: 0 | 1;
  made_at: string | null;
  rating: 1 | 2 | 3 | null;
  rated_at: string | null;
  created_at: string;
}

export interface PlantDiscoveryRow {
  id: number;
  student_id: number;
  plant_id: number;
  first_scanned_at: string;
  last_scanned_at: string;
}

export interface GardenSelectionRow {
  id: number;
  class_id: number;
  plant_id: number;
  selected_by: number | null;
  created_at: string;
}

export type ActorType = 'student' | 'teacher' | 'parent' | 'admin';

export interface ActivityLogRow {
  id: number;
  actor_type: ActorType;
  actor_id: number;
  action: string;
  content_type: 'plant' | 'recipe' | null;
  content_id: number | null;
  created_at: string;
}
