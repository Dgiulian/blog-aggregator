import { db } from "..";
import { feeds, users } from "../../../schema";
import { and, eq, getTableColumns } from "drizzle-orm";

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
