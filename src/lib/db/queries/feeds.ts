import { db } from "..";
import { feeds, users } from "../../../schema";
import { and, eq, getTableColumns, sql } from "drizzle-orm";

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

export function getAllFeeds() {
  return db
    .select({
      ...getTableColumns(feeds),
      user: users,
    })
    .from(feeds)
    .leftJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByUrl(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
  return result;
}

/**
 * Marks a feed as fetched by updating its last_fetched_at timestamp
 * @param feedId The ID of the feed to mark as fetched
 * @returns The updated feed
 */
export async function markFeedFetched(feedId: string) {
  const now = new Date();
  const [result] = await db
    .update(feeds)
    .set({
      lastFetchedAt: now,
      updatedAt: now,
    })
    .where(eq(feeds.id, feedId))
    .returning();
  return result;
}

/**
 * Gets the next feed that should be fetched
 * Orders feeds by last_fetched_at (nulls first), then by created_at
 * @returns The next feed to fetch, or undefined if no feeds exist
 */
export async function getNextFeedToFetch() {
  const [result] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} NULLS FIRST, ${feeds.createdAt}`)
    .limit(1);
  return result;
}
