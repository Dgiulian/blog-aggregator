import { db } from "..";
import { users } from "../../../schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const [result] = await db.select().from(users).where(eq(users.name, name));
  return result;
}

export function deleteUsers() {
  return db.delete(users);
}

export function getAllUsers() {
  return db.select().from(users);
}
