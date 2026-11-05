import "./_env";
import { migrate } from "drizzle-orm/libsql/migrator";
import { client, db } from "../lib/db";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./data/karasancak.db";
  if (url.startsWith("file:")) {
    // Okuma ve yazmaların birbirini kilitlememesi için. Ayar dosyada kalıcıdır.
    await client.execute("PRAGMA journal_mode = WAL");
  }
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Veritabanı şeması güncel.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
