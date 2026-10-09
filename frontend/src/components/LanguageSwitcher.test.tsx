import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { getLocale, setLocale, useLocale } from '@/lib/i18n'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    setLocale('tr')
    localStorage.clear()
  })

  it('renders correctly with TR as initial active language', () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-locale', 'tr')
    expect(screen.getByText('TR')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('switches language from TR to EN when clicked', async () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button')
    expect(getLocale()).toBe('tr')

    await userEvent.click(button)

    expect(getLocale()).toBe('en')
    expect(button).toHaveAttribute('data-locale', 'en')
    expect(localStorage.getItem('ecommerce.lang')).toBe('en')
  })

  it('toggles back to TR when clicked again', async () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button')
    await userEvent.click(button)
    expect(getLocale()).toBe('en')

    await userEvent.click(button)
    expect(getLocale()).toBe('tr')
    expect(button).toHaveAttribute('data-locale', 'tr')
  })

  it('switches to target language when clicking specific language labels', async () => {
    render(<LanguageSwitcher />)

    await userEvent.click(screen.getByText('EN'))
    expect(getLocale()).toBe('en')

    await userEvent.click(screen.getByText('TR'))
    expect(getLocale()).toBe('tr')
  })

  it('causes instant re-rendering of components using useLocale', async () => {
    function TestConsumer() {
      const { t } = useLocale()
      return <span data-testid="translated">{t('common.save')}</span>
    }

    render(
      <div>
        <LanguageSwitcher />
        <TestConsumer />
      </div>,
    )

    expect(screen.getByTestId('translated')).toHaveTextContent('Kaydet')

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByTestId('translated')).toHaveTextContent('Save')
  })
})
