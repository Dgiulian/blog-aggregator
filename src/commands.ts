import { readConfig, setUser } from "./config";
import { createFeed, getFeedByUrl, Feed, User } from "./lib/db/queries/feeds";
import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollowByUrl,
} from "./lib/db/queries/feedFollows";
import { createUser, getAllUsers, getUserByName } from "./lib/db/queries/users";
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

export async function handlerAgg(cmdName: string, ...args: string[]) {
  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
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
