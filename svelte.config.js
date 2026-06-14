import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node: standalone Node server (`node build`) for the ECS Fargate
		// container. (Was adapter-auto, which can't detect Fargate.)
		adapter: adapter(),

		// Single shared .env at the repo root (next to docker-compose.yaml), so
		// the panel, the designer app, and the compose stack all read one file.
		env: { dir: '..' },

		alias: {
			// Shared, read-only imports from the sibling furniture-designer app.
			// We import its serializer, export types, Model and prop registry —
			// never modify anything under this path.
			$fd: '../furniture-designer/src/lib'
		},

		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
