/**
 * Price service for the admin panel.
 *
 * The `price` table is the single source of truth for prop prices — both the
 * panel and furniture-designer read it directly. There are no hardcoded
 * defaults; the table is seeded once (see scripts/seed-prices.ts) and edited
 * here. A prop without a row simply has no price.
 */

import { db } from './db';
import { price } from './db/schema';
import { asc } from 'drizzle-orm';

export interface PriceRow {
	propId: string;
	value: number;
	updatedAt: Date;
}

/**
 * List every priced prop, ordered by id for a stable editor.
 */
export async function listPrices(): Promise<PriceRow[]> {
	return db
		.select({ propId: price.propId, value: price.value, updatedAt: price.updatedAt })
		.from(price)
		.orderBy(asc(price.propId));
}

/**
 * Upsert a single prop price.
 */
export async function setPrice(propId: string, value: number): Promise<void> {
	await db
		.insert(price)
		.values({ propId, value, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: price.propId,
			set: { value, updatedAt: new Date() }
		});
}
