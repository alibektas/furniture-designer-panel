import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	listArtworks,
	createArtwork,
	deleteArtwork,
	DuplicateUniqueIdError,
	type ListFilters
} from '$lib/server/artwork';
import { isPanelSide, parsePanelTypeKey } from '$lib/panel-types';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const load: PageServerLoad = async ({ url }) => {
	const filters: ListFilters = {};
	const search = url.searchParams.get('q')?.trim();
	const width = url.searchParams.get('w');
	const height = url.searchParams.get('h');
	const side = url.searchParams.get('side');

	if (search) filters.search = search;
	if (width) filters.widthCm = Number(width);
	if (height) filters.heightCm = Number(height);
	if (side && isPanelSide(side)) filters.side = side;

	const artworks = await listArtworks(filters);
	return {
		artworks,
		filters: {
			q: search ?? '',
			w: width ?? '',
			h: height ?? '',
			side: side ?? ''
		}
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const uniqueId = String(form.get('uniqueId') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const panelType = String(form.get('panelType') ?? '');
		const side = String(form.get('side') ?? '');
		const priceRaw = String(form.get('price') ?? '');
		const image = form.get('image');

		const values = { uniqueId, name, panelType, side, price: priceRaw };

		if (!uniqueId) return fail(400, { error: 'Unique ID is required.', values });
		if (!name) return fail(400, { error: 'Name is required.', values });

		const dims = parsePanelTypeKey(panelType);
		if (!dims) return fail(400, { error: 'Choose a valid panel type.', values });
		if (!isPanelSide(side)) return fail(400, { error: 'Choose a side.', values });

		const price = Number(priceRaw);
		if (!Number.isFinite(price) || price < 0) {
			return fail(400, { error: 'Price must be a non-negative number.', values });
		}

		if (!(image instanceof File) || image.size === 0) {
			return fail(400, { error: 'An image file is required.', values });
		}
		if (!ALLOWED_TYPES.includes(image.type)) {
			return fail(400, { error: 'Image must be a JPEG, PNG, or WebP.', values });
		}
		if (image.size > MAX_IMAGE_BYTES) {
			return fail(400, { error: 'Image must be 15 MB or smaller.', values });
		}

		const buffer = Buffer.from(await image.arrayBuffer());

		try {
			const created = await createArtwork({
				uniqueId,
				name,
				widthCm: dims.widthCm,
				heightCm: dims.heightCm,
				side,
				price,
				image: buffer,
				contentType: image.type
			});
			return { created: created.id };
		} catch (err) {
			if (err instanceof DuplicateUniqueIdError) {
				return fail(409, { error: err.message, values });
			}
			console.error('createArtwork failed', err);
			return fail(500, { error: 'Failed to save artwork. Please try again.', values });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing artwork id.' });
		const ok = await deleteArtwork(id);
		if (!ok) return fail(404, { error: 'Artwork not found.' });
		return { deleted: id };
	}
};
