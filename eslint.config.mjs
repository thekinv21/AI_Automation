import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * FSD v2.1 layers, highest to lowest. `app/` at the root is the Next.js
 * router,
 *
 *
 * `src/_app` and `src/_pages` are the FSD app and pages layers.
 */

const fsdElements = [
	{ type: 'routes', pattern: 'app/**', partialMatch: false },
	{ type: 'app', pattern: 'src/_app/**', partialMatch: false },
	{
		type: 'pages',
		pattern: 'src/_pages/*/**',
		partialMatch: false,
		capture: ['slice'],
	},
	{
		type: 'features',
		pattern: 'src/features/*/**',
		partialMatch: false,
		capture: ['slice'],
	},
	{
		type: 'entities',
		pattern: 'src/entities/*/**',
		partialMatch: false,
		capture: ['slice'],
	},
	{ type: 'shared', pattern: 'src/shared/**', partialMatch: false },
]

/**
 *
 * Same slice imports are allowed, other slices on the same layer are not.
 */

const sameSlice = type => ({
	to: {
		element: { type, captured: { slice: '{{ from.element.captured.slice }}' } },
	},
})
const layers = (...types) => ({ to: { element: { types: types } } })

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
		plugins: { boundaries },
		settings: {
			'boundaries/elements': fsdElements,
			'boundaries/include': ['app/**/*', 'src/**/*'],
			'import/resolver': {
				typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
			},
		},
		rules: {
			/**
			 * Layers may only import from layers strictly below them.
			 */
			'boundaries/dependencies': [
				2,
				{
					default: 'disallow',
					policies: [
						{
							from: { element: { type: 'routes' } },
							allow: layers('app', 'pages', 'shared'),
						},
						{
							from: { element: { type: 'app' } },
							allow: layers('app', 'pages', 'features', 'entities', 'shared'),
						},
						{
							from: { element: { type: 'pages' } },
							allow: [
								sameSlice('pages'),
								layers('features', 'entities', 'shared'),
							],
						},
						{
							from: { element: { type: 'features' } },
							allow: [sameSlice('features'), layers('entities', 'shared')],
						},
						{
							from: { element: { type: 'entities' } },
							allow: [sameSlice('entities'), layers('shared')],
						},
						{ from: { element: { type: 'shared' } }, allow: layers('shared') },
					],
				},
			],
			/**
			 * Slices are consumed only through their public API (index.ts),
			 *
			 *  shared through a segment or component folder index.
			 */
			'no-restricted-imports': [
				2,
				{
					patterns: [
						{
							regex: '^@/(_app|_pages|features|entities)/[^/]+/.+',
							message: 'Import the slice through its public API (index.ts).',
						},
						{
							regex: '^@/shared/[^/]+/[^/]+/.+',
							message:
								'Import shared code through its segment or component index.',
						},
						{
							regex: '^(\\.\\./){2,}',
							message: 'Use the @/ alias instead of deep relative imports.',
						},
					],
				},
			],
		},
	},

	/**
	 * Override default ignores of eslint-config-next.
	 */
	globalIgnores([
		/**
		 * Default ignores of eslint-config-next:
		 */

		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
])

export default eslintConfig
