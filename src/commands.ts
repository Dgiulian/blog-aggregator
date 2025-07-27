import { readConfig, setUser } from "./config";
import { createUser, getAllUsers, getUserByName } from "./lib/db/queries/users";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = {
  [key: string]: CommandHandler;
};

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
