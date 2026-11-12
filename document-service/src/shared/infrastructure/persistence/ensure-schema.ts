import { Logger } from '@nestjs/common';
import { Client } from 'pg';

/**
 * Database per Service: when the service runs on a shared PostgreSQL instance (free-tier cloud),
 * its tables live in a private schema (DB_SCHEMA) that no other service accesses.
 */
export async function ensureSchema(): Promise<void> {
  const schema = process.env.DB_SCHEMA;
  if (!schema) return;
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error(`Invalid DB_SCHEMA '${schema}'`);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    Logger.log(`Using database schema '${schema}'`, 'Database');
  } finally {
    await client.end();
  }
}
