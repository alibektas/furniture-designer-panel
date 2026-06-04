<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmtDate(d: Date): string {
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>Orders</title></svelte:head>

<main class="mx-auto max-w-4xl p-6">
	<header class="mb-6 flex items-baseline justify-between">
		<h1 class="text-2xl font-semibold">Orders</h1>
		<nav class="text-sm">
			<a class="text-blue-600 hover:underline" href="/prices">Prices →</a>
		</nav>
	</header>

	{#if data.orders.length === 0}
		<p class="rounded border border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
			No orders yet.
		</p>
	{:else}
		<div class="overflow-x-auto rounded border border-gray-200">
			<table class="w-full border-collapse text-sm">
				<thead class="bg-gray-50 text-left text-gray-600">
					<tr>
						<th class="px-3 py-2 font-medium">Email</th>
						<th class="px-3 py-2 font-medium">Name</th>
						<th class="px-3 py-2 font-medium">Created</th>
						<th class="px-3 py-2 font-medium">Links</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as order (order.id)}
						<tr class="border-t border-gray-100 hover:bg-gray-50">
							<td class="px-3 py-2">
								<a class="text-blue-600 hover:underline" href="mailto:{order.email}">{order.email}</a>
							</td>
							<td class="px-3 py-2 text-gray-700">{order.name ?? '—'}</td>
							<td class="px-3 py-2 whitespace-nowrap text-gray-500">{fmtDate(order.createdAt)}</td>
							<td class="px-3 py-2 whitespace-nowrap">
								<a
									class="text-blue-600 hover:underline"
									href="{data.designerUrl}/render/{order.id}"
									target="_blank"
									rel="noopener noreferrer">Drawing</a
								>
								<span class="text-gray-300">·</span>
								<a
									class="text-blue-600 hover:underline"
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
