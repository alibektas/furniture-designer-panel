import type { PageServerLoad, Actions } from './$types';
import { listPrices, setPrice } from '$lib/server/prices';
import { listArtworkPrices, setArtworkPrice } from '$lib/server/artwork';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [prices, artworkPrices] = await Promise.all([listPrices(), listArtworkPrices()]);
	return { prices, artworkPrices };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const propId = form.get('propId');
		const raw = form.get('value');

		if (typeof propId !== 'string' || !propId) {
			return fail(400, { error: 'Missing prop id' });
		}

		const value = Number(raw);
		if (raw === null || raw === '' || !Number.isFinite(value) || value < 0) {
			return fail(400, { error: 'Price must be a non-negative number', propId });
		}

		await setPrice(propId, value);
		return { saved: propId };
	},

	saveArtwork: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		const raw = form.get('value');

		if (typeof id !== 'string' || !id) {
			return fail(400, { error: 'Missing artwork id' });
		}

		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0) {
			return fail(400, { error: 'Price must be a non-negative number', artworkId: id });
		}

		const ok = await setArtworkPrice(id, value);
		if (!ok) return fail(404, { error: 'Artwork not found', artworkId: id });
		return { savedArtwork: id };
	}
};
