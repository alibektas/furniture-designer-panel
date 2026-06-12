import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	listCollections,
	createCollection,
	deleteCollection,
	validateFurnitureExport,
	DuplicateCollectionIdError
} from '$lib/server/collection';

const MAX_JSON_BYTES = 5 * 1024 * 1024; // 5 MB — drawings are small JSON.

export const load: PageServerLoad = async () => {
	const items = await listCollections();
	// Base URL of the customer-facing furniture-designer app, used to build the
	// per-item "View" link into /collection/[id]. Falls back to local dev.
	const designerUrl = (env.FURNITURE_DESIGNER_URL ?? 'http://localhost:5173').replace(/\/$/, '');
	return { items, designerUrl };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const file = form.get('file');
		const pasted = String(form.get('json') ?? '').trim();

		const values = { id };

		if (!id) return fail(400, { error: 'Unique ID is required.', values });

		// The drawing JSON can come either from an uploaded .json file or pasted
		// into the textarea. The file wins when both are present.
		let raw: string;
		if (file instanceof File && file.size > 0) {
			if (file.size > MAX_JSON_BYTES) {
				return fail(400, { error: 'JSON file must be 5 MB or smaller.', values });
			}
			raw = await file.text();
		} else if (pasted) {
			raw = pasted;
		} else {
			return fail(400, { error: 'Provide a JSON file or paste the drawing JSON.', values });
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'The provided JSON could not be parsed.', values });
		}

		const problems = validateFurnitureExport(parsed);
		if (problems.length) {
			return fail(400, { error: `Invalid drawing JSON: ${problems.join(' ')}`, values });
		}

		try {
			const created = await createCollection({ id, data: parsed as never });
			return { created: created.id };
		} catch (err) {
			if (err instanceof DuplicateCollectionIdError) {
				return fail(409, { error: err.message, values });
			}
			console.error('createCollection failed', err);
			return fail(500, { error: 'Failed to save collection item. Please try again.', values });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing collection id.' });
		const ok = await deleteCollection(id);
		if (!ok) return fail(404, { error: 'Collection item not found.' });
		return { deleted: id };
	}
};
