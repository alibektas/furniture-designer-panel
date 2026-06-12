/**
 * Collection service for the admin panel.
 *
 * Owns the `collection` table. Admins paste a drawing's JSON export under a
 * company-defined unique id; furniture-designer reads the table to show the
 * collection and let customers clone an item. Unlike artwork there is no MinIO
 * involvement — the whole drawing lives in the `data` jsonb column.
 */

import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { collection, type Collection } from './db/schema';

/** Minimal public shape of a FurnitureExport — enough to validate + store. */
interface FurnitureExportLike {
	version: string;
	grid: { width: number; height: number; cells: unknown[] };
	props: unknown[];
	[key: string]: unknown;
}

/**
 * Validate that a parsed JSON value looks like a FurnitureExport. Mirrors the
 * core checks in furniture-designer's `validateExport` (version + grid + props)
 * without coupling to that package. Returns the list of problems; empty == ok.
 */
export function validateFurnitureExport(data: unknown): string[] {
	const errors: string[] = [];

	if (!data || typeof data !== 'object') {
		return ['JSON root must be an object.'];
	}
	const d = data as Record<string, unknown>;

	if (typeof d.version !== 'string' || !d.version) {
		errors.push('Missing or invalid "version" field.');
	}

	const grid = d.grid as Record<string, unknown> | undefined;
	if (!grid || typeof grid !== 'object') {
		errors.push('Missing "grid" data.');
	} else {
		if (typeof grid.width !== 'number' || grid.width <= 0) errors.push('Invalid grid width.');
		if (typeof grid.height !== 'number' || grid.height <= 0) errors.push('Invalid grid height.');
		if (!Array.isArray(grid.cells)) {
			errors.push('Invalid grid cells array.');
		} else if (typeof grid.height === 'number' && grid.cells.length !== grid.height) {
			errors.push(`Grid height mismatch: declared ${grid.height}, actual ${grid.cells.length}.`);
		}
	}

	if (!Array.isArray(d.props)) {
		errors.push('"props" must be an array.');
	}

	return errors;
}

export class DuplicateCollectionIdError extends Error {
	constructor(id: string) {
		super(`A collection item with id "${id}" already exists.`);
		this.name = 'DuplicateCollectionIdError';
	}
}

/** Public list shape: id + a short summary derived from the stored drawing. */
export interface CollectionListRow {
	id: string;
	version: string;
	createdAt: Date;
	updatedAt: Date;
}

/** List collection items, ordered by id for a stable catalog-like ordering. */
export async function listCollections(): Promise<CollectionListRow[]> {
	return db
		.select({
			id: collection.id,
			version: collection.version,
			createdAt: collection.createdAt,
			updatedAt: collection.updatedAt
		})
		.from(collection)
		.orderBy(asc(collection.id));
}

export interface CreateCollectionInput {
	/** Admin-supplied unique code; becomes the row's primary key. */
	id: string;
	/** The parsed drawing JSON (already validated by the caller or here). */
	data: FurnitureExportLike;
}

/**
 * Create a collection item. Validates the drawing JSON, rejects duplicate ids,
 * and stores the whole export in the `data` column.
 */
export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
	const id = input.id.trim();
	if (!id) throw new Error('A unique id is required.');

	const problems = validateFurnitureExport(input.data);
	if (problems.length) {
		throw new Error(`Invalid drawing JSON: ${problems.join(' ')}`);
	}

	// Pre-flight duplicate check for a friendly error.
	const existing = await db
		.select({ id: collection.id })
		.from(collection)
		.where(eq(collection.id, id))
		.limit(1);
	if (existing.length) throw new DuplicateCollectionIdError(id);

	try {
		const [row] = await db
			.insert(collection)
			.values({ id, data: input.data, version: input.data.version })
			.returning();
		return row;
	} catch (err) {
		if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
			throw new DuplicateCollectionIdError(id);
		}
		throw err;
	}
}

/** Delete a collection item. Returns false if not found. */
export async function deleteCollection(id: string): Promise<boolean> {
	const [row] = await db.delete(collection).where(eq(collection.id, id)).returning({ id: collection.id });
	return !!row;
}
