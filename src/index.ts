import { CommandsRegistry, registerCommand, runCommand } from './commands';
import { handlerLogin } from './login';

function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, 'login', handlerLogin);

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Error: No command provided.');
    process.exit(1);
  }

  const [cmdName, ...cmdArgs] = args;

  try {
    runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred.');
    }
    process.exit(1);
  }
}

main();