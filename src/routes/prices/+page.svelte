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

<main class="mx-auto max-w-4xl p-6">
	<header class="mb-6 flex items-baseline justify-between">
		<h1 class="text-2xl font-semibold">Prices</h1>
		<nav class="text-sm">
			<a class="text-blue-600 hover:underline" href="/orders">Orders →</a>
		</nav>
	</header>

	{#if form?.error}
		<p class="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
	{/if}

	<div class="overflow-x-auto rounded border border-gray-200">
		<table class="w-full border-collapse text-sm">
			<thead class="bg-gray-50 text-left text-gray-600">
				<tr>
					<th class="px-3 py-2 font-medium">Prop ID</th>
					<th class="px-3 py-2 font-medium">Default</th>
					<th class="px-3 py-2 font-medium">Price</th>
					<th class="px-3 py-2 font-medium">Updated</th>
					<th class="px-3 py-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.prices as row (row.kmPropId)}
					{@const justSaved = form?.saved === row.kmPropId}
					<tr class="border-t border-gray-100 hover:bg-gray-50">
						<td class="px-3 py-2 font-mono text-xs">{row.kmPropId}</td>
						<td class="px-3 py-2 text-gray-400">{row.defaultValue}</td>
						<td colspan="3" class="px-3 py-1">
							<form
								method="POST"
								action="?/save"
								class="flex items-center gap-2"
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
									class="w-32 rounded border border-gray-300 px-2 py-1 text-right
										{row.override !== null ? 'bg-white' : 'bg-gray-50 text-gray-500'}"
								/>
								<span class="w-44 text-xs text-gray-400">{fmtDate(row.updatedAt)}</span>
								<button
									type="submit"
									disabled={savingId === row.kmPropId}
									class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white
										hover:bg-blue-700 disabled:opacity-50"
								>
									{savingId === row.kmPropId ? 'Saving…' : 'Save'}
								</button>
								{#if justSaved && savingId !== row.kmPropId}
									<span class="text-xs text-green-600">Saved</span>
								{/if}
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-3 text-xs text-gray-500">
		Greyed values use the furniture-designer default. Saving stores an override in the database.
		Clear the field and save to revert to the default.
	</p>
</main>
