import {
	pgTable,
	text,
	timestamp,
	jsonb,
	doublePrecision,
	integer,
	boolean,
	uniqueIndex,
	index
} from 'drizzle-orm/pg-core';

/**
 * The `furniture_model` table. Written by furniture-designer (the customer app
 * inserts a row on each save / "Interested" inquiry); the panel reads it to
 * list leads — rows with a non-null email come from the inquiry flow.
 *
 * The panel is the single owner of ALL migrations for this shared DB, so this
 * table IS migrated from here. furniture-designer declares a matching schema
 * for read/write access only (no migrations). Keep columns in sync with
 * ../furniture-designer/src/lib/server/db/schema.ts.
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
 * Admin-managed prices, keyed by prop id. Owned by the panel and the single
 * source of truth for prop prices; furniture-designer reads this table directly.
 */
export const price = pgTable('price', {
	propId: text('prop_id').primaryKey(),
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

/**
 * Curated collection of starter models. Owned by the panel: admins paste a
 * drawing's JSON export here under a company-defined unique id. furniture-designer
 * reads this table (as a read-only mirror) to show the collection and let
 * customers clone an item as their point of departure.
 *
 * Same shape as `furniture_model` — `data` holds a FurnitureExport — but the
 * primary key `id` IS the admin-supplied unique code (not a UUID), so the
 * customer-facing route `/collection/[id]` looks an item up directly by it.
 * Keep columns in sync with ../furniture-designer/src/lib/server/db/schema.ts.
 */
export const collection = pgTable('collection', {
	/** Admin-supplied unique code; also the customer-facing route id. */
	id: text('id').primaryKey(),
	/** JSON-serialized FurnitureExport (the drawing). */
	data: jsonb('data').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
	/** Export format version, taken from the uploaded JSON. */
	version: text('version').notNull()
});

export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;

/* -------------------------------------------------------------------------- */
/* Better Auth                                                                 */
/*                                                                             */
/* Tables for the admin login (username + password). Managed by Better Auth   */
/* via the Drizzle adapter; columns mirror its core + username-plugin schema.  */
/* Generated with `bunx @better-auth/cli generate` — keep in sync if the auth  */
/* config (src/lib/server/auth.ts) gains plugins. Admins are seeded by         */
/* scripts/seed-admin.ts; there is no public sign-up.                          */
/* -------------------------------------------------------------------------- */

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	/** Normalized (lowercased) login name. */
	username: text('username').unique(),
	/** Original-cased username for display. */
	displayUsername: text('display_username')
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(t) => [index('session_user_id_idx').on(t.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
		scope: text('scope'),
		/** Hashed password for username/email login. */
		password: text('password'),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' })
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [index('account_user_id_idx').on(t.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [index('verification_identifier_idx').on(t.identifier)]
);

export type User = typeof user.$inferSelect;
