<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmtDate(d: Date): string {
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>Orders</title></svelte:head>

<main class="mx-auto max-w-4xl p-6 sm:p-8">
	<header class="mb-8 flex items-baseline justify-between border-b border-gray-200 pb-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-gray-900">Orders</h1>
			{#if data.orders.length > 0}
				<p class="mt-1 text-sm text-gray-500">
					{data.orders.length}
					{data.orders.length === 1 ? 'order' : 'orders'}
				</p>
			{/if}
		</div>
		<nav class="flex items-center gap-4 text-sm">
			<a class="font-medium text-gray-500 hover:text-gray-700 hover:underline" href={resolve('/')}
				>Home</a
			>
			<a
				class="font-medium text-blue-600 hover:text-blue-700 hover:underline"
				href={resolve('/prices')}>Prices →</a
			>
		</nav>
	</header>

	{#if data.orders.length === 0}
		<div
			class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-12 text-center text-sm text-gray-500"
		>
			No orders yet.
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
			<table class="w-full border-collapse text-sm">
				<thead
					class="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
				>
					<tr>
						<th class="px-4 py-3">Email</th>
						<th class="px-4 py-3">Name</th>
						<th class="px-4 py-3">Created</th>
						<th class="px-4 py-3">Links</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.orders as order (order.id)}
						<tr class="transition-colors odd:bg-white even:bg-gray-50/40 hover:bg-blue-50/40">
							<td class="px-4 py-3">
								<a
									class="font-medium text-blue-600 hover:text-blue-700 hover:underline"
									href="mailto:{order.email}">{order.email}</a
								>
							</td>
							<td class="px-4 py-3 text-gray-700">{order.name ?? '—'}</td>
							<td class="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(order.createdAt)}</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<a
									class="text-blue-600 hover:text-blue-700 hover:underline"
									href="{data.designerUrl}/{order.id}/view"
									target="_blank"
									rel="noopener noreferrer">Drawing</a
								>
								<span class="px-1 text-gray-300">·</span>
								<a
									class="text-blue-600 hover:text-blue-700 hover:underline"
									href="{data.designerUrl}/api/models/{order.id}/pdf"
									target="_blank"
									rel="noopener noreferrer">Datasheet</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
