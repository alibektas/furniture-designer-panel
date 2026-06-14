import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

/**
 * Populate `event.locals` with the current user/session and hand auth API
 * requests (`/api/auth/*`) to Better Auth.
 */
const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};

/** Paths reachable without a session. Everything else requires an admin login. */
const PUBLIC_PATHS = ['/login'];

/**
 * Gate the whole panel behind a login. Unauthenticated requests to any
 * non-public route are redirected to `/login`; an already-authenticated admin
 * hitting `/login` is bounced to the home page.
 */
const handleGuard: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth');

	if (!event.locals.user && !isPublic) {
		const target = pathname + event.url.search;
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(target)}`);
	}

	if (event.locals.user && pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};

export const handle = sequence(handleAuth, handleGuard);
