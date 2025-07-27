import { setUser } from './config';

export type CommandHandler = (cmdName: string, ...args: string[]) => void;

export type CommandsRegistry = {
  [key: string]: CommandHandler;
};

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
) {
  registry[cmdName] = handler;
}

export function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (handler) {
    handler(cmdName, ...args);
  } else {
    console.error(`Error: Unknown command '${cmdName}'`);
    process.exit(1);
  }
}
