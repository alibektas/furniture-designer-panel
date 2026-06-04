import { pgTable, text, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

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
