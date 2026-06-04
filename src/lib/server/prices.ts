/**
 * Price service for the admin panel.
 *
 * Merges the DB-stored overrides (table `price`) on top of the default/fallback
 * values derived from furniture-designer. The panel owns writing overrides; the
 * defaults are display seeds and the safety net.
 */

import { db } from './db';
import { price } from './db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_PRICES } from './default-prices';
import type { AllKMPropIds } from '$fd/server/km_prop';

export interface PriceRow {
	kmPropId: AllKMPropIds;
	/** Default/fallback value from furniture-designer. */
	defaultValue: number;
	/** Admin override stored in the DB, or null when none is set. */
	override: number | null;
	/** Effective value: override when set, otherwise default. */
	effective: number;
	updatedAt: Date | null;
}

/**
 * List every known prop id with its default, its DB override (if any), and the
 * effective price. Ordering follows the default-prices declaration order so the
 * editor is stable and grouped the way furniture-designer lists them.
 */
export async function listPrices(): Promise<PriceRow[]> {
	const overrides = await db.select().from(price);
	const overrideMap = new Map(overrides.map((o) => [o.kmPropId, o]));

	return (Object.entries(DEFAULT_PRICES) as [AllKMPropIds, number][]).map(
		([kmPropId, defaultValue]) => {
			const o = overrideMap.get(kmPropId);
			const override = o ? o.value : null;
			return {
				kmPropId,
				defaultValue,
				override,
				effective: override ?? defaultValue,
				updatedAt: o ? o.updatedAt : null
			};
		}
	);
}

/**
 * Upsert a single override. Passing null clears the override (reverts to default).
 */
export async function setPrice(kmPropId: string, value: number | null): Promise<void> {
	if (value === null) {
		await db.delete(price).where(eq(price.kmPropId, kmPropId));
		return;
	}

	await db
		.insert(price)
		.values({ kmPropId, value, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: price.kmPropId,
			set: { value, updatedAt: new Date() }
		});
}
