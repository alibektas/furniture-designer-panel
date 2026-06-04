/**
 * Orders = furniture_model rows that carry a customer email (the "Interested" /
 * inquiry flow). Read-only here; furniture-designer owns writes to this table.
 */

import { db } from './db';
import { furnitureModel } from './db/schema';
import { isNotNull, desc } from 'drizzle-orm';

export interface Order {
	id: string;
	email: string;
	name: string | null;
	createdAt: Date;
}

export async function listOrders(): Promise<Order[]> {
	const rows = await db
		.select({
			id: furnitureModel.id,
			email: furnitureModel.email,
			data: furnitureModel.data,
			createdAt: furnitureModel.createdAt
		})
		.from(furnitureModel)
		.where(isNotNull(furnitureModel.email))
		.orderBy(desc(furnitureModel.createdAt));

	return rows.map((r) => ({
		id: r.id,
		email: r.email as string,
		// metadata.name is optional in the serialized FurnitureExport.
		name: (r.data as { metadata?: { name?: string } })?.metadata?.name ?? null,
		createdAt: r.createdAt
	}));
}
