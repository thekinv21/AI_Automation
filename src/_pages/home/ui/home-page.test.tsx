import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'bun:test'

import { HomePage } from './home-page'

describe('HomePage', () => {
	it('renders the heading', () => {
		render(<HomePage />)

		expect(
			screen.getByRole('heading', { level: 1, name: /to get started/i }),
		).toBeInTheDocument()
	})

	it('links to the documentation', () => {
		render(<HomePage />)

		expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
			'href',
			expect.stringContaining('nextjs.org/docs'),
		)
	})
})
