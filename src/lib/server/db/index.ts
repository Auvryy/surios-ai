import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios';

// In development, avoid exhausting connection pool across hot module reloads
const client = postgres(connectionString, {
	max: process.env.NODE_ENV === 'production' ? 20 : 5,
	idle_timeout: 20,
	connect_timeout: 10
});

export const db = drizzle(client, { schema });
export * from './schema.js';
