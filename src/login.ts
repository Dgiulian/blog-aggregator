import { setUser } from "./config";
import { getUserByName } from "./lib/db/queries/users";

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("Error: Missing username for login command.");
  }
  const username = args[0];
  const user = await getUserByName(username);
  if (!user) {
    throw new Error(`Error: User "${username}" not found.`);
  }
  setUser(username);
  console.log(`User set to: ${username}`);
}
