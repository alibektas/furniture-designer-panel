/**
 * Seed the `price` table with the full prop price list.
 *
 * The list in seed-prices.json was lifted from furniture-designer's former
 * hardcoded BASE_PRICES (the original source of truth, now removed). This is a
 * one-time bootstrap so the DB — which both apps now read as the single source
 * of truth — starts complete. Re-runnable: existing rows are upserted, so keys
 * present here are reset to the seed value.
 *
 * Run from the panel dir:  bun run db:seed
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { price } from '../src/lib/server/db/schema';

// Single shared .env lives at the repo root (next to docker-compose.yaml).
// Read DATABASE_URL from there if it isn't already in the environment.
function databaseUrl(): string {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	try {
		const env = readFileSync(new URL('../../.env', import.meta.url), 'utf-8');
		const line = env.split('\n').find((l) => l.trimStart().startsWith('DATABASE_URL='));
		if (line) return line.slice(line.indexOf('=') + 1).trim();
	} catch (err) {
		if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
	}
	throw new Error('DATABASE_URL is not set');
}

const prices = JSON.parse(
	readFileSync(new URL('./seed-prices.json', import.meta.url), 'utf-8')
) as Record<string, number>;

const rows = Object.entries(prices).map(([propId, value]) => ({
	propId,
	value,
	updatedAt: new Date()
}));

const client = postgres(databaseUrl(), { max: 1 });
const db = drizzle(client);

console.log(`Seeding ${rows.length} prices…`);

await db
	.insert(price)
	.values(rows)
	.onConflictDoUpdate({
		target: price.propId,
		set: { value: sql`excluded.value`, updatedAt: sql`now()` }
	});

console.log('Done.');
await client.end();
