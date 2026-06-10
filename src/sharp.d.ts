// sharp ships its types at `sharp/lib/index.d.ts` but its package.json
// `exports` map doesn't expose them under TypeScript's "bundler" module
// resolution, so the bare `import sharp from 'sharp'` resolves to `any`.
// Re-point the module to the real declarations here.
declare module 'sharp' {
	export * from 'sharp/lib/index.js';
	export { default } from 'sharp/lib/index.js';
}
