import { env } from 'cloudflare:workers';
import { eq, lt } from 'drizzle-orm';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type AdminDb = DrizzleD1Database<typeof schema>;

export async function getDb(): Promise<AdminDb> {
  return drizzle(env.ADMIN_DB, { schema });
}

export async function claimDedupeKey(key: string, retentionMs: number, now: Date = new Date()): Promise<boolean> {
  const db = await getDb();
  await db.delete(schema.dedupeKeys).where(lt(schema.dedupeKeys.receivedAt, new Date(now.getTime() - retentionMs).toISOString()));
  const inserted = await db
    .insert(schema.dedupeKeys)
    .values({ key, receivedAt: now.toISOString() })
    .onConflictDoNothing()
    .returning({ key: schema.dedupeKeys.key });
  return inserted.length > 0;
}

export async function releaseDedupeKey(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.dedupeKeys).where(eq(schema.dedupeKeys.key, key));
}
