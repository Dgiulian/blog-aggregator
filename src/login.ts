import { setUser } from './config';

export function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error('Error: Missing username for login command.');
  }
  const username = args[0];
  setUser(username);
  console.log(`User set to: ${username}`);
}
