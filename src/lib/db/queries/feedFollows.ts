import { db } from "..";
import { feedFollows, feeds, users } from "../../../schema";
import { eq, getTableColumns } from "drizzle-orm";

export type FeedFollow = typeof feedFollows.$inferSelect;

export async function createFeedFollow(userId: string, feedId: string) {
  const [result] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const feedFollow = await db
    .select({
      ...getTableColumns(feedFollows),
      user: users,
      feed: feeds,
    })
    .from(feedFollows)
    .where(eq(feedFollows.id, result.id))
    .leftJoin(users, eq(feedFollows.userId, users.id))
    .leftJoin(feeds, eq(feedFollows.feedId, feeds.id));

  return feedFollow[0];
}

export async function getFeedFollowsForUser(userId: string) {
  return db
    .select({
      ...getTableColumns(feedFollows),
      user: users,
      feed: feeds,
    })
    .from(feedFollows)
    .where(eq(feedFollows.userId, userId))
    .leftJoin(users, eq(feedFollows.userId, users.id))
    .leftJoin(feeds, eq(feedFollows.feedId, feeds.id));
}
