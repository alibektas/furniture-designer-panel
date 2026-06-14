import type { LayoutServerLoad } from './$types';

/** Expose the signed-in admin (if any) to every page for the layout chrome. */
export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user };
};
