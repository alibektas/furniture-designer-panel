/**
 * Better Auth configuration for the admin panel.
 *
 * Admins sign in with a username + password (no email, no OAuth). Accounts are
 * created out-of-band by `scripts/seed-admin.ts` — public sign-up is disabled,
 * so the only way in is an account an operator seeded.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from './db';
import * as schema from './db/schema';

if (!env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	emailAndPassword: {
		// Enabled so the password verifier (used by the username plugin) is wired
		// up. Sign-up is disabled — admins are seeded, never self-registered.
		enabled: true,
		disableSignUp: true
	},
	plugins: [username(), sveltekitCookies(getRequestEvent)]
});
