<svelte:head><title>Admin Panel</title></svelte:head>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-2xl font-semibold">Furniture Designer — Admin</h1>
	<ul class="space-y-2">
		<li>
			<a class="text-blue-600 hover:underline" href="/prices">Prices</a>
			<span class="text-sm text-gray-500">— view and edit prop prices</span>
		</li>
		<li>
			<a class="text-blue-600 hover:underline" href="/orders">Orders</a>
			<span class="text-sm text-gray-500">— customers who left their email, with their drawing</span>
		</li>
		<li>
			<a class="text-blue-600 hover:underline" href="/artwork">Artwork</a>
			<span class="text-sm text-gray-500">— browse, search, add and delete artwork</span>
		</li>
	</ul>
</main>
