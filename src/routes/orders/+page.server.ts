import type { PageServerLoad } from './$types';
import { listOrders } from '$lib/server/orders';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	const orders = await listOrders();
	// Base URL of the customer-facing furniture-designer app, used to build the
	// per-order links. Falls back to the local dev server.
	const designerUrl = (env.FURNITURE_DESIGNER_URL ?? 'http://localhost:5173').replace(/\/$/, '');
	return { orders, designerUrl };
};
