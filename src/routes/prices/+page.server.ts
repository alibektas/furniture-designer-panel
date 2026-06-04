import type { PageServerLoad, Actions } from './$types';
import { listPrices, setPrice } from '$lib/server/prices';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const prices = await listPrices();
	return { prices };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const kmPropId = form.get('kmPropId');
		const raw = form.get('value');

		if (typeof kmPropId !== 'string' || !kmPropId) {
			return fail(400, { error: 'Missing prop id' });
		}

		// Empty value clears the override (reverts to the default).
		if (raw === null || raw === '') {
			await setPrice(kmPropId, null);
			return { saved: kmPropId, cleared: true };
		}

		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0) {
			return fail(400, { error: 'Price must be a non-negative number', kmPropId });
		}

		await setPrice(kmPropId, value);
		return { saved: kmPropId };
	}
};
