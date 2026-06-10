import {
	pgTable,
	text,
	timestamp,
	jsonb,
	doublePrecision,
	integer,
	uniqueIndex
} from 'drizzle-orm/pg-core';

/**
 * Mirror of furniture-designer's `furniture_model` table. The panel reads this
 * (same postgres DB, admin privileges) to list leads — rows with a non-null
 * email come from the "Interested"/inquiry flow. Keep columns in sync with
 * ../furniture-designer/src/lib/server/db/schema.ts. Do not migrate this table
 * from the panel; furniture-designer owns it.
 */
export const furnitureModel = pgTable('furniture_model', {
	id: text('id').primaryKey(),
	email: text('email'),
	data: jsonb('data').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
	version: text('version').notNull()
});

export type FurnitureModel = typeof furnitureModel.$inferSelect;

/**
 * Admin-managed prices, keyed by KM prop id. Owned by the panel. furniture-designer
 * reads these as overrides, falling back to its hardcoded BASE_PRICES when a key
 * is absent here.
 */
export const price = pgTable('price', {
	kmPropId: text('km_prop_id').primaryKey(),
	value: doublePrecision('value').notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
});

export type Price = typeof price.$inferSelect;

/**
 * Artwork catalog. Owned by the panel. Admins browse/search/filter and add
 * artworks here; each row points at a full-size image + a generated thumbnail
 * stored in MinIO (object storage).
 *
 * A "panel type" is defined purely by width × height (cm) plus the side
 * (left/right) — derived from the company part-number codes, e.g.
 * `pno_ts-f_a070-h140-art-70x140left` → width 70, height 140, side left.
 *
 * `uniqueId` is the company's own artwork code (shown with a tooltip in the
 * add dialog) and is enforced unique. `price` is set once on creation; it is
 * edited afterwards from the Prices/props admin, not here.
 */
export const artwork = pgTable(
	'artwork',
	{
		id: text('id').primaryKey(),
		/** Company-defined unique code for this artwork. */
		uniqueId: text('unique_id').notNull(),
		name: text('name').notNull(),
		/** Panel width in cm (e.g. 70, 105). */
		widthCm: integer('width_cm').notNull(),
		/** Panel height in cm (e.g. 105, 140, 175, 210). */
		heightCm: integer('height_cm').notNull(),
		/** Which side the artwork is oriented for. */
		side: text('side', { enum: ['left', 'right'] }).notNull(),
		/** Price in EUR, set on creation; edited later from the props admin. */
		price: doublePrecision('price').notNull(),
		/** MinIO object key of the full-size image. */
		objectKey: text('object_key').notNull(),
		/** MinIO object key of the generated thumbnail. */
		thumbKey: text('thumb_key').notNull(),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
	},
	(t) => [uniqueIndex('artwork_unique_id_idx').on(t.uniqueId)]
);

export type Artwork = typeof artwork.$inferSelect;
export type NewArtwork = typeof artwork.$inferInsert;
