<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';

	let { children, data } = $props();

	let signingOut = $state(false);

	async function signOut() {
		signingOut = true;
		await authClient.signOut();
		await invalidateAll();
		signingOut = false;
		await goto('/login');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.user}
	<header class="flex items-center justify-end gap-3 border-b px-6 py-3 text-sm">
		<span class="text-gray-600">
			Signed in as <strong
				>{data.user.displayUsername ?? data.user.username ?? data.user.name}</strong
			>
		</span>
		<Button variant="outline" size="sm" disabled={signingOut} onclick={signOut}>
			{signingOut ? 'Signing out…' : 'Sign out'}
		</Button>
	</header>
{/if}

{@render children()}
