import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { readConfig } from "../config";

async function main() {
  const config = readConfig();
  const sql = postgres(config.dbUrl, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  console.log("Migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
