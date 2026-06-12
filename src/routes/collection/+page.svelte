<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import HomeIcon from '@lucide/svelte/icons/house';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// --- Add dialog state ---
	let addOpen = $state(false);
	let submitting = $state(false);

	// Form field state (so a failed submit can repopulate the id).
	let id = $state('');

	function resetForm() {
		id = '';
	}

	/** Customer-facing URL where this collection item can be viewed/cloned. */
	function viewUrl(itemId: string): string {
		return `${data.designerUrl}/collection/${encodeURIComponent(itemId)}`;
	}

	function fmtDate(d: string | Date): string {
		return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(d));
	}
</script>

<svelte:head><title>Collection</title></svelte:head>

<Toaster />

<main class="mx-auto max-w-5xl p-6 sm:p-8">
	<header class="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Collection</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{data.items.length}
				{data.items.length === 1 ? 'starter model' : 'starter models'}
				— curated drawings customers can clone as a point of departure
			</p>
		</div>
		<div class="flex items-center gap-3">
			<nav class="flex items-center gap-4 text-sm text-muted-foreground">
				<a
					class="inline-flex items-center gap-1 hover:text-foreground hover:underline"
					href={resolve('/')}
				>
					<HomeIcon class="size-4" /> Home
				</a>
				<a class="hover:text-foreground hover:underline" href={resolve('/artwork')}>Artwork →</a>
			</nav>
			<Button onclick={() => (addOpen = true)}>
				<PlusIcon class="size-4" /> Add to collection
			</Button>
		</div>
	</header>

	{#if data.items.length === 0}
		<div class="rounded-lg border border-dashed py-16 text-center">
			<p class="text-sm text-muted-foreground">No collection items yet.</p>
			<Button class="mt-4" variant="outline" onclick={() => (addOpen = true)}>
				<PlusIcon class="size-4" /> Add your first item
			</Button>
		</div>
	{:else}
		<div class="rounded-lg border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Unique ID</Table.Head>
						<Table.Head>Version</Table.Head>
						<Table.Head>Added</Table.Head>
						<Table.Head class="text-right">Link</Table.Head>
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.items as item (item.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-sm">{item.id}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">{item.version}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">{fmtDate(item.createdAt)}</Table.Cell>
							<Table.Cell class="text-right">
								<a
									href={viewUrl(item.id)}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
								>
									View <ExternalLinkIcon class="size-3.5" />
								</a>
							</Table.Cell>
							<Table.Cell>
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === 'success') toast.success('Collection item deleted');
										};
									}}
								>
									<input type="hidden" name="id" value={item.id} />
									<Button
										type="submit"
										variant="destructive"
										size="icon"
										class="size-8"
										title="Delete collection item"
										onclick={(e: MouseEvent) => {
											if (!confirm(`Delete "${item.id}"? This cannot be undone.`)) e.preventDefault();
										}}
									>
										<TrashIcon class="size-4" />
									</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</main>

<!-- Add to collection dialog -->
<Dialog.Root
	bind:open={addOpen}
	onOpenChange={(o) => {
		if (!o) resetForm();
	}}
>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add to collection</Dialog.Title>
			<Dialog.Description>
				Give the starter model a unique ID and provide its drawing JSON — either upload the exported
				.json file or paste it below.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/create"
			enctype="multipart/form-data"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					submitting = false;
					if (result.type === 'success') {
						addOpen = false;
						resetForm();
						toast.success('Added to collection');
					}
				};
			}}
			class="space-y-4"
		>
			{#if form?.error}
				<p
					class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{form.error}
				</p>
			{/if}

			<div class="grid gap-2">
				<div class="flex items-center gap-1.5">
					<Label for="id">Unique ID</Label>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger type="button" class="text-muted-foreground hover:text-foreground">
								<InfoIcon class="size-3.5" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="max-w-56">
									The code used to identify this starter model. It becomes the customer-facing URL,
									e.g. /collection/26000001.
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
				<Input id="id" name="id" bind:value={id} placeholder="e.g. 26000001" required />
			</div>

			<div class="grid gap-2">
				<Label for="file">Drawing JSON file</Label>
				<Input id="file" name="file" type="file" accept="application/json,.json" />
				<p class="text-xs text-muted-foreground">
					The drawing exported from the designer. Up to 5 MB.
				</p>
			</div>

			<div class="grid gap-2">
				<Label for="json">…or paste JSON</Label>
				<textarea
					id="json"
					name="json"
					rows="6"
					placeholder={'{ "version": "...", "grid": { ... }, "props": [ ... ] }'}
					class="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
				></textarea>
				<p class="text-xs text-muted-foreground">Used only if no file is selected above.</p>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (addOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : 'Add to collection'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
