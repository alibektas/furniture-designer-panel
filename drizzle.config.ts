import { defineConfig } from 'drizzle-kit';

// Single shared .env lives at the repo root (next to docker-compose.yaml).
// drizzle-kit runs with this dir as cwd, so load the parent .env explicitly.
if (!process.env.DATABASE_URL) {
	try {
		process.loadEnvFile(new URL('../.env', import.meta.url));
	} catch (err) {
		// A missing root .env is fine — DATABASE_URL may come from the real
		// environment (CI, shell export, compose). Anything else (e.g. a
		// malformed .env) is a real problem and should surface.
		if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
	}
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
