import { db } from "..";
import { posts, feeds, feedFollows, users } from "../../../schema";
import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";

export type Post = typeof posts.$inferSelect;

/**
 * Creates a new post in the database
 * @param title The title of the post
 * @param url The URL of the post
 * @param description The description of the post
 * @param publishedAt The publication date of the post
 * @param feedId The ID of the feed the post belongs to
 * @returns The created post
 */
export async function createPost(
  title: string,
  url: string,
  description: string | null,
  publishedAt: Date | null,
  feedId: string
) {
  try {
    const [result] = await db
      .insert(posts)
      .values({
        title,
        url,
        description,
        publishedAt,
        feedId,
      })
      .returning();
    return { success: true, post: result };
  } catch (error: any) {
    // Handle unique constraint violation (duplicate URL)
    if (error.code === "23505") {
      return { success: false, error: "Post with this URL already exists" };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Gets posts for a specific user from feeds they follow
 * @param userId The ID of the user
 * @param limit The maximum number of posts to return (default: 10)
 * @returns An array of posts from feeds the user follows
 */
export async function getPostsForUser(userId: string, limit: number = 10) {
  // First, get all feed IDs that the user follows
  const followedFeeds = await db
    .select({ feedId: feedFollows.feedId })
    .from(feedFollows)
    .where(eq(feedFollows.userId, userId));

  const feedIds = followedFeeds.map((feed) => feed.feedId);

  // If the user doesn't follow any feeds, return an empty array
  if (feedIds.length === 0) {
    return [];
  }

  // Get posts from the feeds the user follows
  return db
    .select({
      ...getTableColumns(posts),
      feed: {
        name: feeds.name,
        url: feeds.url,
      },
    })
    .from(posts)
    .leftJoin(feeds, eq(posts.feedId, feeds.id))
    .where(inArray(posts.feedId, feedIds))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

/**
 * Checks if a post with the given URL already exists
 * @param url The URL to check
 * @returns True if a post with the URL exists, false otherwise
 */
export async function postExistsByUrl(url: string) {
  const [result] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.url, url))
    .limit(1);

  return !!result;
}
