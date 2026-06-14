/**
 * Create (or update the password of) an admin account for the panel login.
 *
 * The panel disables public sign-up — this script is the only way an account
 * gets created. It stands up its own Better Auth instance (same DB, sign-up
 * enabled) so it can call the normal sign-up flow, which hashes the password
 * exactly the way the running app's login expects.
 *
 * The panel logs in by username, so email is incidental; if you don't pass one
 * we synthesize `<username>@admin.local`.
 *
 * Run from the panel dir:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='choose-a-strong-one' bun run scripts/seed-admin.ts
 * Optional: ADMIN_EMAIL, ADMIN_NAME.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username as usernamePlugin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import * as schema from '../src/lib/server/db/schema';

// Single shared .env lives at the repo root (next to docker-compose.yaml).
function readEnvVar(name: string): string | undefined {
	if (process.env[name]) return process.env[name];
	try {
		const env = readFileSync(new URL('../../.env', import.meta.url), 'utf-8');
		const line = env.split('\n').find((l) => l.trimStart().startsWith(`${name}=`));
		if (line) return line.slice(line.indexOf('=') + 1).trim();
	} catch (err) {
		if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
	}
	return undefined;
}

const DATABASE_URL = readEnvVar('DATABASE_URL');
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const BETTER_AUTH_SECRET = readEnvVar('BETTER_AUTH_SECRET');
if (!BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');

const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminUsername || !adminPassword) {
	throw new Error(
		'Set ADMIN_USERNAME and ADMIN_PASSWORD, e.g.\n' +
			"  ADMIN_USERNAME=admin ADMIN_PASSWORD='strong-password' bun run scripts/seed-admin.ts"
	);
}
if (adminPassword.length < 8) {
	throw new Error('ADMIN_PASSWORD must be at least 8 characters');
}

const adminEmail = (
	process.env.ADMIN_EMAIL?.trim() || `${adminUsername}@admin.local`
).toLowerCase();
const adminName = process.env.ADMIN_NAME?.trim() || adminUsername;

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	// Sign-up stays enabled here (unlike the app) so we can create the account.
	emailAndPassword: { enabled: true },
	plugins: [usernamePlugin()]
});

const existing = await db
	.select({ id: schema.user.id })
	.from(schema.user)
	.where(eq(schema.user.username, adminUsername.toLowerCase()))
	.limit(1);

if (existing.length > 0) {
	// Account already exists — reset its password rather than erroring out.
	const ctx = await auth.$context;
	const hash = await ctx.password.hash(adminPassword);
	await ctx.internalAdapter.updatePassword(existing[0].id, hash);
	console.log(`✓ Updated password for admin "${adminUsername}".`);
} else {
	await auth.api.signUpEmail({
		body: {
			email: adminEmail,
			password: adminPassword,
			name: adminName,
			username: adminUsername
		}
	});
	console.log(`✓ Created admin "${adminUsername}" (${adminEmail}).`);
}

await client.end();
process.exit(0);
