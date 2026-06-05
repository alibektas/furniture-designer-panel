<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Track which row is currently saving, to show feedback per row.
	let savingId = $state<string | null>(null);

	function fmtDate(d: Date | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>Prices</title></svelte:head>

<main class="mx-auto max-w-4xl p-6 sm:p-8">
	<header class="mb-8 flex items-baseline justify-between border-b border-gray-200 pb-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-gray-900">Prices</h1>
			<p class="mt-1 text-sm text-gray-500">
				{data.prices.length}
				{data.prices.length === 1 ? 'property' : 'properties'}
			</p>
		</div>
		<nav class="text-sm">
			<a class="font-medium text-blue-600 hover:text-blue-700 hover:underline" href="/orders"
				>Orders →</a
			>
		</nav>
	</header>

	{#if form?.error}
		<p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
			{form.error}
		</p>
	{/if}

	<div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
		<table class="w-full border-collapse text-sm">
			<thead class="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
				<tr>
					<th class="px-4 py-3">Prop ID</th>
					<th class="px-4 py-3">Default</th>
					<th class="px-4 py-3">Price</th>
					<th class="px-4 py-3">Updated</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.prices as row (row.kmPropId)}
					{@const justSaved = form?.saved === row.kmPropId}
					<tr class="transition-colors odd:bg-white even:bg-gray-50/40 hover:bg-blue-50/40">
						<td class="px-4 py-3 font-mono text-xs text-gray-600">{row.kmPropId}</td>
						<td class="px-4 py-3 text-gray-400">{row.defaultValue}</td>
						<td colspan="3" class="px-4 py-2">
							<form
								method="POST"
								action="?/save"
								class="flex items-center gap-3"
								use:enhance={() => {
									savingId = row.kmPropId;
									return async ({ update }) => {
										await update({ reset: false });
										savingId = null;
									};
								}}
							>
								<input type="hidden" name="kmPropId" value={row.kmPropId} />
								<input
									name="value"
									type="number"
									step="any"
									min="0"
									value={row.override ?? row.effective}
									placeholder={String(row.defaultValue)}
									class="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-right shadow-sm
										focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
										{row.override !== null ? 'bg-white' : 'bg-gray-50 text-gray-500'}"
								/>
								<span class="w-44 text-xs text-gray-400">{fmtDate(row.updatedAt)}</span>
								<button
									type="submit"
									disabled={savingId === row.kmPropId}
									class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm
										transition-colors hover:bg-blue-700 disabled:opacity-50"
								>
									{savingId === row.kmPropId ? 'Saving…' : 'Save'}
								</button>
								{#if justSaved && savingId !== row.kmPropId}
									<span class="text-xs font-medium text-green-600">Saved</span>
								{/if}
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-4 text-xs leading-relaxed text-gray-500">
		Greyed values use the furniture-designer default. Saving stores an override in the database.
		Clear the field and save to revert to the default.
	</p>
</main>
