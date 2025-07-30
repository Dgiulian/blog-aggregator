import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerAgg,
  handlerRegister,
  handlerUsers,
  handlerAddFeed,
  handlerListFeeds,
  handlerFollow,
  handlerFollowing,
  handlerUnfollow,
  middlewareLoggedIn,
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

  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerListFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));

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
