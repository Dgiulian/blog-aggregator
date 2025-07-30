import { db } from "..";
import { feedFollows, feeds, users } from "../../../schema";
import { and, eq, getTableColumns } from "drizzle-orm";

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

/**
 * Deletes a feed follow record for a specific user and feed
 * @param userId The ID of the user
 * @param feedId The ID of the feed
 * @returns The number of deleted records
 */
export async function deleteFeedFollow(userId: string, feedId: string) {
  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)));

  return 1; // Return 1 to indicate success
}

/**
 * Deletes a feed follow record for a specific user and feed URL
 * @param userId The ID of the user
 * @param feedUrl The URL of the feed
 * @returns An object indicating success and details about the operation
 */
export async function deleteFeedFollowByUrl(userId: string, feedUrl: string) {
  // First, get the feed by URL
  const feed = await db.select().from(feeds).where(eq(feeds.url, feedUrl));

  if (!feed || feed.length === 0) {
    return { success: false, message: `Feed with URL "${feedUrl}" not found` };
  }

  const feedId = feed[0].id;

  // Check if the user is following this feed
  const followExists = await db
    .select()
    .from(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)));

  if (!followExists || followExists.length === 0) {
    return { success: false, message: "You are not following this feed" };
  }

  // Delete the feed follow
  const result = await deleteFeedFollow(userId, feedId);

  return {
    success: true,
    message: "Successfully unfollowed feed",
    feedUrl,
    deletedCount: result,
  };
}
