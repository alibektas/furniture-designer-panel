/**
 * Artwork service for the admin panel.
 *
 * Owns the `artwork` table and the corresponding objects in MinIO. On create
 * it stores the full-size image plus a generated thumbnail; on delete it
 * removes both objects and the row.
 */

import sharp from 'sharp';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './db';
import { artwork, type Artwork } from './db/schema';
import { putObject, removeObject, publicUrl } from './minio';
import { isPanelSide, type PanelSide } from '$lib/panel-types';

/** Max thumbnail width in px; height scales to preserve aspect ratio. */
const THUMB_WIDTH = 480;

export interface ArtworkView extends Artwork {
	/** Public URL of the full-size image. */
	imageUrl: string;
	/** Public URL of the thumbnail. */
	thumbUrl: string;
}

export interface ListFilters {
	/** Free-text search across name + unique id. */
	search?: string;
	widthCm?: number;
	heightCm?: number;
	side?: PanelSide;
}

function toView(row: Artwork): ArtworkView {
	return { ...row, imageUrl: publicUrl(row.objectKey), thumbUrl: publicUrl(row.thumbKey) };
}

/** List artworks, optionally filtered/searched. Newest first. */
export async function listArtworks(filters: ListFilters = {}): Promise<ArtworkView[]> {
	const conds = [];
	if (filters.search) {
		const term = `%${filters.search}%`;
		conds.push(or(ilike(artwork.name, term), ilike(artwork.uniqueId, term)));
	}
	if (filters.widthCm) conds.push(eq(artwork.widthCm, filters.widthCm));
	if (filters.heightCm) conds.push(eq(artwork.heightCm, filters.heightCm));
	if (filters.side) conds.push(eq(artwork.side, filters.side));

	const rows = await db
		.select()
		.from(artwork)
		.where(conds.length ? and(...conds) : undefined)
		.orderBy(sql`${artwork.createdAt} desc`, asc(artwork.uniqueId));

	return rows.map(toView);
}

export interface CreateArtworkInput {
	uniqueId: string;
	name: string;
	widthCm: number;
	heightCm: number;
	side: PanelSide;
	price: number;
	/** Raw uploaded image bytes. */
	image: Buffer;
	/** Original mime type (e.g. image/jpeg). */
	contentType: string;
}

export class DuplicateUniqueIdError extends Error {
	constructor(uniqueId: string) {
		super(`An artwork with unique id "${uniqueId}" already exists.`);
		this.name = 'DuplicateUniqueIdError';
	}
}

/**
 * Create an artwork: store the full image + a generated thumbnail in MinIO,
 * then insert the row. If the DB insert fails (e.g. duplicate unique id), the
 * just-uploaded objects are cleaned up so we don't leak orphans.
 */
export async function createArtwork(input: CreateArtworkInput): Promise<ArtworkView> {
	if (!isPanelSide(input.side)) throw new Error(`Invalid side: ${input.side}`);

	// Pre-flight duplicate check for a friendly error before we touch storage.
	const existing = await db
		.select({ id: artwork.id })
		.from(artwork)
		.where(eq(artwork.uniqueId, input.uniqueId))
		.limit(1);
	if (existing.length) throw new DuplicateUniqueIdError(input.uniqueId);

	const id = crypto.randomUUID();
	const ext = input.contentType === 'image/png' ? 'png' : 'jpg';
	const objectKey = `full/${id}.${ext}`;
	const thumbKey = `thumb/${id}.webp`;

	// Generate the thumbnail (webp for size); never upscale past the original.
	const thumb = await sharp(input.image)
		.resize({ width: THUMB_WIDTH, withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();

	await putObject(objectKey, input.image, input.contentType);
	await putObject(thumbKey, thumb, 'image/webp');

	try {
		const [row] = await db
			.insert(artwork)
			.values({
				id,
				uniqueId: input.uniqueId,
				name: input.name,
				widthCm: input.widthCm,
				heightCm: input.heightCm,
				side: input.side,
				price: input.price,
				objectKey,
				thumbKey
			})
			.returning();
		return toView(row);
	} catch (err) {
		// Roll back the orphaned objects on insert failure.
		await Promise.all([removeObject(objectKey), removeObject(thumbKey)]);
		// Surface a duplicate that slipped past the pre-flight (race) cleanly.
		if (err instanceof Error && /unique/i.test(err.message)) {
			throw new DuplicateUniqueIdError(input.uniqueId);
		}
		throw err;
	}
}

export interface ArtworkPriceRow {
	id: string;
	uniqueId: string;
	name: string;
	widthCm: number;
	heightCm: number;
	side: string;
	price: number;
	updatedAt: Date;
}

/**
 * List artworks as price rows for the props/Prices admin. Ordered by unique id
 * so the editor is stable.
 */
export async function listArtworkPrices(): Promise<ArtworkPriceRow[]> {
	return db
		.select({
			id: artwork.id,
			uniqueId: artwork.uniqueId,
			name: artwork.name,
			widthCm: artwork.widthCm,
			heightCm: artwork.heightCm,
			side: artwork.side,
			price: artwork.price,
			updatedAt: artwork.updatedAt
		})
		.from(artwork)
		.orderBy(asc(artwork.uniqueId));
}

/** Update a single artwork's price. Returns false if the artwork is gone. */
export async function setArtworkPrice(id: string, value: number): Promise<boolean> {
	const [row] = await db
		.update(artwork)
		.set({ price: value, updatedAt: new Date() })
		.where(eq(artwork.id, id))
		.returning({ id: artwork.id });
	return !!row;
}

/** Delete an artwork and its stored objects. Returns false if not found. */
export async function deleteArtwork(id: string): Promise<boolean> {
	const [row] = await db.delete(artwork).where(eq(artwork.id, id)).returning();
	if (!row) return false;
	await Promise.all([removeObject(row.objectKey), removeObject(row.thumbKey)]);
	return true;
}
