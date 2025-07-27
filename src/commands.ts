import { setUser } from "./config";
import { createUser, getUserByName, resetDb } from "./lib/db/queries/users";

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

export async function handlerReset() {
  await resetDb();
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
