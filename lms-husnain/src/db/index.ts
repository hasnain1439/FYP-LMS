// src/db/index.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in your .env file");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, 
  // 👇 ADD THESE 2 LINES
  connectionTimeoutMillis: 60000, // Wait 60s before crashing
  idleTimeoutMillis: 60000,       // Keep connection alive longer
});

export const db = drizzle(pool, { schema });