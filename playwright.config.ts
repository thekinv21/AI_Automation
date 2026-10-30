import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://localhost:${PORT}`
const outputRoot = './tests/playwright'

export default defineConfig({
	testDir: './tests/e2e',
	outputDir: `${outputRoot}/results`,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? 'github'
		: [['html', { outputFolder: `${outputRoot}/report`, open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: 'bun dev',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
})
