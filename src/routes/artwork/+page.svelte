<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageData, ActionData } from './$types';
	import {
		PANEL_TYPES,
		PANEL_WIDTHS,
		PANEL_HEIGHTS,
		PANEL_SIDES,
		panelTypeKey,
		panelTypeLabel
	} from '$lib/panel-types';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import HomeIcon from '@lucide/svelte/icons/house';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// --- Add dialog state ---
	let addOpen = $state(false);
	let submitting = $state(false);

	// Form field state (so a failed submit can repopulate).
	let uniqueId = $state('');
	let name = $state('');
	let panelType = $state('');
	let side = $state('');
	let price = $state('');

	const panelTypeLabelText = $derived(
		panelType
			? (panelTypeLabel(
					PANEL_TYPES.find((t) => panelTypeKey(t) === panelType) ?? { widthCm: 0, heightCm: 0 }
				) ?? 'Select panel type')
			: 'Select panel type'
	);
	const sideLabelText = $derived(side ? side[0].toUpperCase() + side.slice(1) : 'Select side');

	function resetForm() {
		uniqueId = '';
		name = '';
		panelType = '';
		side = '';
		price = '';
	}

	// --- Filter state (URL-driven) ---
	// Local input box seeded from the current URL; navigation updates the URL,
	// not this box, so reading the query param once at init is intentional.
	let q = $state(page.url.searchParams.get('q') ?? '');
	const widthFilter = $derived(page.url.searchParams.get('w') ?? '');
	const heightFilter = $derived(page.url.searchParams.get('h') ?? '');
	const sideFilter = $derived(page.url.searchParams.get('side') ?? '');

	function applyFilters(next: Record<string, string>) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(next)) {
			if (v) params.set(k, v);
			else params.delete(k);
		}
		const query = params.toString();
		const target = query ? (`/artwork?${query}` as const) : '/artwork';
		goto(resolve(target), { keepFocus: true, noScroll: true });
	}

	let searchTimer: ReturnType<typeof setTimeout>;
	function onSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => applyFilters({ q }), 250);
	}

	const hasActiveFilters = $derived(!!(q || widthFilter || heightFilter || sideFilter));
	function clearFilters() {
		q = '';
		goto(resolve('/artwork'), { keepFocus: true, noScroll: true });
	}

	function fmtPrice(v: number): string {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
	}
</script>

<svelte:head><title>Artwork</title></svelte:head>

<Toaster />

<main class="mx-auto max-w-6xl p-6 sm:p-8">
	<header class="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Artwork</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{data.artworks.length}
				{data.artworks.length === 1 ? 'artwork' : 'artworks'}
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
				<a class="hover:text-foreground hover:underline" href={resolve('/prices')}>Prices →</a>
			</nav>
			<Button onclick={() => (addOpen = true)}>
				<PlusIcon class="size-4" /> Add artwork
			</Button>
		</div>
	</header>

	<!-- Filters / search -->
	<div class="mb-6 flex flex-wrap items-end gap-3">
		<div class="relative flex-1 sm:max-w-xs">
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				class="pl-8"
				placeholder="Search name or unique ID…"
				bind:value={q}
				oninput={onSearchInput}
			/>
		</div>

		<div class="grid gap-1.5">
			<Label class="text-xs text-muted-foreground">Width</Label>
			<Select.Root type="single" value={widthFilter} onValueChange={(v) => applyFilters({ w: v })}>
				<Select.Trigger class="w-28">{widthFilter ? `${widthFilter} cm` : 'Any'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="">Any</Select.Item>
					{#each PANEL_WIDTHS as w (w)}
						<Select.Item value={String(w)}>{w} cm</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="grid gap-1.5">
			<Label class="text-xs text-muted-foreground">Height</Label>
			<Select.Root type="single" value={heightFilter} onValueChange={(v) => applyFilters({ h: v })}>
				<Select.Trigger class="w-28">{heightFilter ? `${heightFilter} cm` : 'Any'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="">Any</Select.Item>
					{#each PANEL_HEIGHTS as h (h)}
						<Select.Item value={String(h)}>{h} cm</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="grid gap-1.5">
			<Label class="text-xs text-muted-foreground">Side</Label>
			<Select.Root
				type="single"
				value={sideFilter}
				onValueChange={(v) => applyFilters({ side: v })}
			>
				<Select.Trigger class="w-28 capitalize">{sideFilter || 'Any'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="">Any</Select.Item>
					{#each PANEL_SIDES as s (s)}
						<Select.Item value={s} class="capitalize">{s}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		{#if hasActiveFilters}
			<Button variant="ghost" onclick={clearFilters}>Clear</Button>
		{/if}
	</div>

	<!-- Grid -->
	{#if data.artworks.length === 0}
		<div class="rounded-lg border border-dashed py-16 text-center">
			<p class="text-sm text-muted-foreground">
				{hasActiveFilters ? 'No artwork matches your filters.' : 'No artwork yet.'}
			</p>
			{#if !hasActiveFilters}
				<Button class="mt-4" variant="outline" onclick={() => (addOpen = true)}>
					<PlusIcon class="size-4" /> Add your first artwork
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.artworks as art (art.id)}
				<div class="group overflow-hidden rounded-lg border bg-card shadow-sm">
					<div class="relative aspect-3/4 overflow-hidden bg-muted">
						<img
							src={art.thumbUrl}
							alt={art.name}
							loading="lazy"
							class="size-full object-cover transition-transform group-hover:scale-105"
						/>
						<form
							method="POST"
							action="?/delete"
							class="absolute top-2 right-2"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') toast.success('Artwork deleted');
								};
							}}
						>
							<input type="hidden" name="id" value={art.id} />
							<Button
								type="submit"
								variant="destructive"
								size="icon"
								class="size-8 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
								title="Delete artwork"
								onclick={(e: MouseEvent) => {
									if (!confirm(`Delete "${art.name}"? This cannot be undone.`)) e.preventDefault();
								}}
							>
								<TrashIcon class="size-4" />
							</Button>
						</form>
					</div>
					<div class="space-y-1.5 p-3">
						<div class="flex items-start justify-between gap-2">
							<h3 class="leading-tight font-medium" title={art.name}>{art.name}</h3>
							<span class="text-sm font-semibold whitespace-nowrap">{fmtPrice(art.price)}</span>
						</div>
						<p class="font-mono text-xs text-muted-foreground">{art.uniqueId}</p>
						<div class="flex flex-wrap gap-1.5 pt-1">
							<Badge variant="secondary">{art.widthCm} × {art.heightCm} cm</Badge>
							<Badge variant="outline" class="capitalize">{art.side}</Badge>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<!-- Add artwork dialog -->
<Dialog.Root
	bind:open={addOpen}
	onOpenChange={(o) => {
		if (!o) resetForm();
	}}
>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add artwork</Dialog.Title>
			<Dialog.Description>
				Upload the artwork image and define its panel type. The price is set here once; change it
				later from the props admin.
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
						toast.success('Artwork added');
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
					<Label for="uniqueId">Unique ID</Label>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger type="button" class="text-muted-foreground hover:text-foreground">
								<InfoIcon class="size-3.5" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="max-w-56">
									The unique code used by the company to identify this artwork.
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
				<Input
					id="uniqueId"
					name="uniqueId"
					bind:value={uniqueId}
					placeholder="e.g. ART-0042"
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" bind:value={name} placeholder="Artwork name" required />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label>Panel type</Label>
					<input type="hidden" name="panelType" value={panelType} />
					<Select.Root type="single" bind:value={panelType}>
						<Select.Trigger class="w-full">{panelTypeLabelText}</Select.Trigger>
						<Select.Content>
							{#each PANEL_TYPES as t (panelTypeKey(t))}
								<Select.Item value={panelTypeKey(t)}>{panelTypeLabel(t)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label>Side</Label>
					<input type="hidden" name="side" value={side} />
					<Select.Root type="single" bind:value={side}>
						<Select.Trigger class="w-full capitalize">{sideLabelText}</Select.Trigger>
						<Select.Content>
							{#each PANEL_SIDES as s (s)}
								<Select.Item value={s} class="capitalize">{s}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="price">Price (EUR)</Label>
				<Input
					id="price"
					name="price"
					type="number"
					step="0.01"
					min="0"
					bind:value={price}
					placeholder="0.00"
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="image">Image</Label>
				<Input
					id="image"
					name="image"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					required
				/>
				<p class="text-xs text-muted-foreground">
					JPEG, PNG or WebP, up to 15 MB. A thumbnail is generated automatically.
				</p>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (addOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : 'Add artwork'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
