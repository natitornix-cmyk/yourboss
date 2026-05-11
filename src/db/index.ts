import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let client: ReturnType<typeof postgres> | undefined;
if (connectionString) {
  try {
    client = postgres(connectionString, { prepare: false, max: 10 });
  } catch (e) {
    console.error(
      "Invalid DATABASE_URL — Drizzle queries will fail until it is fixed:",
      e instanceof Error ? e.message : e,
    );
  }
} else {
  console.warn("DATABASE_URL is not set. Drizzle queries will fail until it is configured.");
}

export const db = client ? drizzle(client, { schema }) : (null as never);
export { schema };
