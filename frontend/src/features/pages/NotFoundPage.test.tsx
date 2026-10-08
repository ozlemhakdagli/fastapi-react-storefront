import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import NotFoundPage from '@/features/pages/NotFoundPage'
import { t } from '@/lib/i18n'
import { renderWithProviders } from '@/test/utils'

function Pathname() {
  return <div data-testid="pathname">{useLocation().pathname}</div>
}

describe('NotFoundPage', () => {
  it('test_not_found_links_home', async () => {
    renderWithProviders(
      <>
        <NotFoundPage />
        <Pathname />
      </>,
      { route: '/no/such/page' },
    )
    const link = screen.getByRole('link', { name: t('pages.not_found_home') })
    expect(link).toHaveAttribute('href', '/')
    await userEvent.click(link)
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
  })
})
