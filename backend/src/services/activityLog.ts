import type Database from 'better-sqlite3';
import type { ActorType } from '../models/types.js';

export interface LogActivityInput {
  actorType: ActorType;
  actorId: number;
  action: string;
  contentType?: 'plant' | 'recipe';
  contentId?: number;
}

/**
 * Records one row per activity for the Super Admin usage dashboard
 * (FR-019). ponytail: a single insert helper, no event-bus/queue — this is
 * an in-process SQLite write, add async batching only if write volume ever
 * becomes a bottleneck.
 */
export function logActivity(db: Database.Database, input: LogActivityInput): void {
  db.prepare(
    `INSERT INTO activity_log (actor_type, actor_id, action, content_type, content_id)
     VALUES (@actorType, @actorId, @action, @contentType, @contentId)`,
  ).run({
    actorType: input.actorType,
    actorId: input.actorId,
    action: input.action,
    contentType: input.contentType ?? null,
    contentId: input.contentId ?? null,
  });
}
