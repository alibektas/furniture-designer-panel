<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import HomeIcon from '@lucide/svelte/icons/house';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Track which row is currently saving, keyed by prop id / artwork id.
	let savingId = $state<string | null>(null);

	function fmtDate(d: Date | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleString('de-DE');
	}
</script>

<svelte:head><title>Prices</title></svelte:head>

<Toaster />

<main class="mx-auto max-w-6xl p-6 sm:p-8">
	<header class="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Prices</h1>
			<p class="mt-1 text-sm text-muted-foreground">Edit prop and artwork prices.</p>
		</div>
		<nav class="flex items-center gap-4 text-sm">
			<a
				class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
				href={resolve('/')}
			>
				<HomeIcon class="size-4" /> Home
			</a>
			<a class="font-medium text-primary hover:underline" href={resolve('/artwork')}>Artwork →</a>
		</nav>
	</header>

	{#if form?.error}
		<p
			class="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
		>
			{form.error}
		</p>
	{/if}

	<!-- Prop prices -->
	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>Prop prices</Card.Title>
			<Card.Description>
				Greyed values use the furniture-designer default. Saving stores an override; clear the field
				and save to revert.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="overflow-x-auto rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Prop ID</Table.Head>
							<Table.Head>Default</Table.Head>
							<Table.Head>Price</Table.Head>
							<Table.Head>Updated</Table.Head>
							<Table.Head></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.prices as row (row.kmPropId)}
							{@const justSaved = form?.saved === row.kmPropId}
							<Table.Row>
								<Table.Cell class="font-mono text-xs text-muted-foreground">
									{row.kmPropId}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.defaultValue}</Table.Cell>
								<Table.Cell colspan={3} class="py-2">
									<form
										method="POST"
										action="?/save"
										class="flex items-center gap-3"
										use:enhance={() => {
											savingId = row.kmPropId;
											return async ({ result, update }) => {
												await update({ reset: false });
												savingId = null;
												if (result.type === 'success') toast.success('Price saved');
											};
										}}
									>
										<input type="hidden" name="kmPropId" value={row.kmPropId} />
										<Input
											name="value"
											type="number"
											step="any"
											min="0"
											value={row.override ?? row.effective}
											placeholder={String(row.defaultValue)}
											class="w-32 text-right {row.override !== null
												? ''
												: 'bg-muted text-muted-foreground'}"
										/>
										<span class="w-44 text-xs text-muted-foreground">{fmtDate(row.updatedAt)}</span>
										<Button type="submit" size="sm" disabled={savingId === row.kmPropId}>
											{savingId === row.kmPropId ? 'Saving…' : 'Save'}
										</Button>
										{#if justSaved && savingId !== row.kmPropId}
											<span class="text-xs font-medium text-green-600">Saved</span>
										{/if}
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Artwork prices -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Artwork prices</Card.Title>
			<Card.Description>
				Prices for artworks added on the <a class="underline" href={resolve('/artwork')}>Artwork</a>
				page. Set once on creation; edit them here.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.artworkPrices.length === 0}
				<p class="py-6 text-center text-sm text-muted-foreground">
					No artwork yet. Add some on the
					<a class="underline" href={resolve('/artwork')}>Artwork</a> page.
				</p>
			{:else}
				<div class="overflow-x-auto rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Artwork</Table.Head>
								<Table.Head>Panel</Table.Head>
								<Table.Head>Price (EUR)</Table.Head>
								<Table.Head>Updated</Table.Head>
								<Table.Head></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.artworkPrices as art (art.id)}
								{@const justSaved = form?.savedArtwork === art.id}
								<Table.Row>
									<Table.Cell>
										<div class="font-medium">{art.name}</div>
										<div class="font-mono text-xs text-muted-foreground">{art.uniqueId}</div>
									</Table.Cell>
									<Table.Cell>
										<Badge variant="secondary">{art.widthCm} × {art.heightCm} cm</Badge>
										<Badge variant="outline" class="ml-1 capitalize">{art.side}</Badge>
									</Table.Cell>
									<Table.Cell colspan={3} class="py-2">
										<form
											method="POST"
											action="?/saveArtwork"
											class="flex items-center gap-3"
											use:enhance={() => {
												savingId = art.id;
												return async ({ result, update }) => {
													await update({ reset: false });
													savingId = null;
													if (result.type === 'success') toast.success('Price saved');
												};
											}}
										>
											<input type="hidden" name="id" value={art.id} />
											<Input
												name="value"
												type="number"
												step="0.01"
												min="0"
												value={art.price}
												class="w-32 text-right"
											/>
											<span class="w-44 text-xs text-muted-foreground"
												>{fmtDate(art.updatedAt)}</span
											>
											<Button type="submit" size="sm" disabled={savingId === art.id}>
												{savingId === art.id ? 'Saving…' : 'Save'}
											</Button>
											{#if justSaved && savingId !== art.id}
												<span class="text-xs font-medium text-green-600">Saved</span>
											{/if}
										</form>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
