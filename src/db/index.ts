import { drizzle } from "drizzle-orm/postgres-js";

import * as authSchema from "@/db/auth-schema";
import * as financialSchema from "@/db/schema";
import * as schemaRelations from "@/db/schema-relations";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}

const db = drizzle(databaseUrl, {
  schema: {
    ...authSchema,
    ...financialSchema,
    ...schemaRelations,
  },
});

export { db };
export default db;
