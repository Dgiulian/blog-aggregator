import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerAgg,
  handlerRegister,
  handlerUsers,
  handlerAddFeed,
  handlerListFeeds,
} from "./commands";
import { handlerLogin } from "./login";
import { handlerReset } from "./reset";

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "reset", handlerReset);

  registerCommand(registry, "addfeed", handlerAddFeed);
  registerCommand(registry, "feeds", handlerListFeeds);

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Error: No command provided.");
    process.exit(1);
  }

  const [cmdName, ...cmdArgs] = args;

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred.");
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
