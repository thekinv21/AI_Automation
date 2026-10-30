import { expect, test } from '@playwright/test'

test('home page renders without console errors', async ({ page }) => {
	const errors: string[] = []
	page.on('console', message => {
		if (message.type() === 'error') errors.push(message.text())
	})
	page.on('pageerror', error => errors.push(error.message))

	await page.goto('/')

	await expect(page).toHaveTitle('AI Automation')
	await expect(
		page.getByRole('heading', { level: 1, name: /to get started/i }),
	).toBeVisible()
	expect(errors).toEqual([])
})
