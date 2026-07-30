import type { Db } from '../db/connection.js';
import type { ActorType } from '../models/types.js';

export interface LogActivityInput {
  actorType: ActorType;
  actorId: number;
  action: string;
  contentType?: 'plant' | 'recipe';
  contentId?: number;
}

/** Records one row per activity for the Super Admin usage dashboard (FR-019). */
export async function logActivity(db: Db, input: LogActivityInput): Promise<void> {
  await db.query(
    `INSERT INTO activity_log (actor_type, actor_id, action, content_type, content_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.actorType,
      input.actorId,
      input.action,
      input.contentType ?? null,
      input.contentId ?? null,
    ],
  );
}
