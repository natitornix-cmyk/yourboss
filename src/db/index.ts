import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Allow the build to complete even without DATABASE_URL set; queries will throw at runtime.
  console.warn("DATABASE_URL is not set. Drizzle queries will fail until it is configured.");
}

const client = connectionString
  ? postgres(connectionString, { prepare: false, max: 10 })
  : (undefined as unknown as ReturnType<typeof postgres>);

export const db = client ? drizzle(client, { schema }) : (null as never);
export { schema };
