/**
 * Browser-side Better Auth client. Used by the login page to sign in with a
 * username/password and by the layout to sign out.
 */

import { createAuthClient } from 'better-auth/svelte';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [usernameClient()]
});
