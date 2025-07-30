import { readConfig, setUser } from "./config";
import {
  createFeed,
  getFeedByUrl,
  Feed,
  User,
  markFeedFetched,
  getNextFeedToFetch,
} from "./lib/db/queries/feeds";
import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollowByUrl,
} from "./lib/db/queries/feedFollows";
import { createUser, getAllUsers, getUserByName } from "./lib/db/queries/users";
import {
  createPost,
  getPostsForUser,
  postExistsByUrl,
} from "./lib/db/queries/posts";
import { fetchFeed, listAllFeeds } from "./rss";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type middlewareLoggedIn = (
  handler: UserCommandHandler
) => CommandHandler;

/**
 * Middleware that ensures a user is logged in before executing a command.
 * It transforms a UserCommandHandler into a regular CommandHandler by
 * fetching the user and passing it to the handler.
 */
export const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
  return async (cmdName: string, ...args: string[]) => {
    const config = readConfig();
    const userName = config.currentUserName;
    const user = await getUserByName(userName);

    if (!user) {
      throw new Error(`User ${userName} not found`);
    }

    return handler(cmdName, user, ...args);
  };
};

export type CommandsRegistry = {
  [key: string]: CommandHandler;
};

function printFeed(feed: Feed, user: User) {
  console.log(`- Feed: ${feed.name}`);
  console.log(`  URL: ${feed.url}`);
  console.log(`  Owner: ${user.name}`);
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }
  const [name, url] = args;

  const feed = await createFeed(name, url, user.id);
  console.log(`Feed created:`);
  printFeed(feed, user);

  const feedFollow = await createFeedFollow(user.id, feed.id);
  console.log(
    `User ${feedFollow.user?.name || "Unknown"} is now following ${
      feedFollow.feed?.name || "Unknown"
    }`
  );
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length < 1) {
    throw new Error("Usage: follow <url>");
  }
  const [url] = args;

  const feed = await getFeedByUrl(url);
  if (!feed) {
    throw new Error(`Error: Feed with URL "${url}" not found.`);
  }
  const feedFollow = await createFeedFollow(user.id, feed.id);
  console.log(
    `User ${feedFollow.user?.name || "Unknown"} is now following ${
      feedFollow.feed?.name || "Unknown"
    }`
  );
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const feedFollows = await getFeedFollowsForUser(user.id);
  console.log(`Feeds followed by ${user.name}:`);
  for (const feedFollow of feedFollows) {
    console.log(`- ${feedFollow.feed?.name || "Unknown feed"}`);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length < 1) {
    throw new Error("Usage: unfollow <url>");
  }
  const [url] = args;

  const result = await deleteFeedFollowByUrl(user.id, url);

  if (result.success) {
    console.log(result.message);
  } else {
    throw new Error(result.message);
  }
}

/**
 * Parses a duration string into milliseconds
 * @param durationStr Duration string in format like "1s", "1m", "1h"
 * @returns Duration in milliseconds
 */
function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      `Invalid duration format: ${durationStr}. Expected format: 1s, 1m, 1h, etc.`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Formats a duration in milliseconds to a human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted duration string
 */
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  let result = "";
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += `${minutes}m`;
  if (seconds > 0 || (hours === 0 && minutes === 0)) result += `${seconds}s`;

  return result;
}

/**
 * Handles errors in the feed aggregation process
 * @param error The error to handle
 */
function handleError(error: any) {
  console.error("Error in feed aggregation:", error);
}

/**
 * Parses a date string from an RSS feed
 * @param dateStr Date string from RSS feed
 * @returns Date object or null if parsing fails
 */
function parsePublishedDate(dateStr: string): Date | null {
  try {
    return new Date(dateStr);
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return null;
  }
}

/**
 * Scrapes feeds from RSS sources
 * Gets the next feed to fetch, marks it as fetched, and saves posts to the database
 */
async function scrapeFeeds() {
  // Get the next feed to fetch
  const feed = await getNextFeedToFetch();

  if (!feed) {
    console.log("No feeds found to fetch");
    return;
  }

  console.log(`Fetching feed: ${feed.name} (${feed.url})`);

  try {
    // Mark the feed as fetched
    await markFeedFetched(feed.id);

    // Fetch the feed content
    const rssFeed = await fetchFeed(feed.url);

    // Process the feed items
    console.log(
      `Found ${rssFeed.channel.item.length} items in feed: ${rssFeed.channel.title}`
    );

    let savedCount = 0;
    let skippedCount = 0;

    // Save the posts to the database
    for (const item of rssFeed.channel.item) {
      // Check if post already exists
      const exists = await postExistsByUrl(item.link);

      if (exists) {
        skippedCount++;
        continue;
      }

      // Parse the published date
      const publishedAt = parsePublishedDate(item.pubDate);

      // Create the post
      const result = await createPost(
        item.title,
        item.link,
        item.description || null,
        publishedAt,
        feed.id
      );

      if (result.success) {
        savedCount++;
        console.log(`Saved: ${item.title}`);
      } else {
        skippedCount++;
        console.log(`Skipped: ${item.title} - ${result.error}`);
      }
    }

    console.log(
      `Feed processing complete. Saved: ${savedCount}, Skipped: ${skippedCount}`
    );
  } catch (error) {
    console.error(`Error fetching feed ${feed.name} (${feed.url}):`, error);
  }
}

/**
 * Aggregates RSS feeds at regular intervals
 * @param cmdName Command name
 * @param args Command arguments
 */
export async function handlerAgg(cmdName: string, ...args: string[]) {
  if (args.length < 1) {
    throw new Error("Usage: agg <time_between_reqs>");
  }

  const timeBetweenRequestsStr = args[0];
  const timeBetweenRequests = parseDuration(timeBetweenRequestsStr);

  console.log(`Collecting feeds every ${formatDuration(timeBetweenRequests)}`);

  // Run the first scrape immediately
  scrapeFeeds().catch(handleError);

  // Set up the interval for subsequent scrapes
  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  // Handle program termination
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

/**
 * Handles the browse command to view latest posts
 * @param cmdName Command name
 * @param user Current user
 * @param args Command arguments
 */
export async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  // Default limit is 2 if not provided
  let limit = 2;

  if (args.length > 0) {
    const parsedLimit = parseInt(args[0], 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = parsedLimit;
    } else {
      console.warn(`Invalid limit: ${args[0]}. Using default limit of 2.`);
    }
  }

  const posts = await getPostsForUser(user.id, limit);

  if (posts.length === 0) {
    console.log("No posts found. Try following some feeds first!");
    return;
  }

  console.log(`Latest ${posts.length} posts from your feeds:`);

  for (const post of posts) {
    console.log(`\n${post.title}`);
    console.log(`Feed: ${post.feed?.name || "Unknown feed"}`);
    console.log(`URL: ${post.url}`);
    console.log(
      `Published: ${
        post.publishedAt ? post.publishedAt.toLocaleString() : "Unknown"
      }`
    );

    if (post.description) {
      // Truncate description if it's too long
      const maxLength = 150;
      const description =
        post.description.length > maxLength
          ? post.description.substring(0, maxLength) + "..."
          : post.description;

      console.log(`Description: ${description}`);
    }
  }
}
export async function handlerListFeeds(cmdName: string, ...args: string[]) {
  await listAllFeeds();
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("Error: Missing username for register command.");
  }
  const username = args[0];
  const existingUser = await getUserByName(username);
  if (existingUser) {
    throw new Error(`Error: User "${username}" already exists.`);
  }
  const user = await createUser(username);
  setUser(username);
  console.log(`User created: ${user.name}`);
  console.log(user);
}

export async function handlerUsers() {
  const users = await getAllUsers();
  const config = readConfig();

  for (let user of users) {
    const isCurrent = user.name === config.currentUserName;
    console.log(`* ${user.name}${isCurrent ? " (current)" : ""}`);
  }
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
) {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (handler) {
    await handler(cmdName, ...args);
  } else {
    console.error(`Error: Unknown command '${cmdName}'`);
    process.exit(1);
  }
}
