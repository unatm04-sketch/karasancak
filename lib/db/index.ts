import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Yerelde dosya tabanlı SQLite, canlıda Turso/libSQL.
 * Kod değişmeden yalnızca DATABASE_URL ile geçiş yapılır.
 */
const DEFAULT_URL = "file:./data/karasancak.db";

type Globals = {
  __ksClient?: Client;
  __ksDb?: LibSQLDatabase<typeof schema>;
};
const globals = globalThis as unknown as Globals;

function createDatabaseClient(): Client {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  if (url.startsWith("file:")) {
    mkdirSync(dirname(resolve(url.slice("file:".length))), { recursive: true });
  }
  return createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    // Yazma kilidi varsa hemen hata vermek yerine bekle.
    timeout: 5000,
  });
}

// Geliştirmede HMR her seferinde yeni bağlantı açmasın diye global'de tutulur.
export const client: Client = globals.__ksClient ?? createDatabaseClient();
export const db: LibSQLDatabase<typeof schema> = globals.__ksDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globals.__ksClient = client;
  globals.__ksDb = db;
}

export { schema };
export type Database = typeof db;
