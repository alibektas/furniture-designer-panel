<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		loading = true;

		const { error: signInError } = await authClient.signIn.username({
			username,
			password
		});

		loading = false;

		if (signInError) {
			error = signInError.message ?? 'Invalid username or password';
			return;
		}

		const redirectTo = page.url.searchParams.get('redirectTo');
		await goto(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/');
	}
</script>

<svelte:head><title>Sign in — Admin Panel</title></svelte:head>

<main class="flex min-h-screen items-center justify-center p-6">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Admin sign in</Card.Title>
			<Card.Description>Enter your admin credentials to continue.</Card.Description>
		</Card.Header>
		<form {onsubmit}>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						bind:value={username}
						autocomplete="username"
						required
						disabled={loading}
					/>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						autocomplete="current-password"
						required
						disabled={loading}
					/>
				</div>
				{#if error}
					<p class="text-sm text-red-600" role="alert">{error}</p>
				{/if}
			</Card.Content>
			<Card.Footer class="mt-6">
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in…' : 'Sign in'}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</main>
