import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const pools = new Map<string, Pool>();

export function createDatabase(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set to a Neon Postgres connection string.");
  }
  // Workerd forbids I/O-backed objects from being reused by another request.
  // Vercel keeps the shared pool below; Cloudflare receives a request-local one.
  if (process.env.DEPLOYMENT_PLATFORM === "cloudflare") {
    return drizzle(new Pool({ connectionString: databaseUrl }), { schema });
  }

  let pool = pools.get(databaseUrl);
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
    pools.set(databaseUrl, pool);
  }
  return drizzle(pool, { schema });
}
