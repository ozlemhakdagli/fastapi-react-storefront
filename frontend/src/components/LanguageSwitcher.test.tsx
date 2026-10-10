import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { getLocale, setLocale, useLocale } from '@/lib/i18n'

describe('LanguageSwitcher', () => {
  beforeEach(() => setLocale('tr'))
  afterEach(() => setLocale('tr'))

  it('names the language it switches to, in the language that is shown', async () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'Dili değiştir: English' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'Switch language: Türkçe' })).toBeInTheDocument()
  })

  it('switches the language with every click and remembers it', async () => {
    render(<LanguageSwitcher />)

    await userEvent.click(screen.getByRole('button'))
    expect(getLocale()).toBe('en')
    expect(localStorage.getItem('ecommerce.lang')).toBe('en')

    await userEvent.click(screen.getByRole('button'))
    expect(getLocale()).toBe('tr')
    expect(localStorage.getItem('ecommerce.lang')).toBe('tr')
  })

  it('translates the components that are on the screen at once', async () => {
    function Consumer() {
      const { t } = useLocale()
      return <span data-testid="translated">{t('common.save')}</span>
    }
    render(
      <>
        <LanguageSwitcher />
        <Consumer />
      </>,
    )
    expect(screen.getByTestId('translated')).toHaveTextContent('Kaydet')

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('translated')).toHaveTextContent('Save')
  })

  it('keeps what is typed in a form', async () => {
    function Form() {
      const { t } = useLocale()
      return (
        <form>
          <label htmlFor="draft">{t('common.save')}</label>
          <input id="draft" />
        </form>
      )
    }
    render(
      <>
        <LanguageSwitcher />
        <Form />
      </>,
    )
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Draft text value')

    await userEvent.click(screen.getByRole('button'))

    expect(getLocale()).toBe('en')
    expect(screen.getByLabelText('Save')).toBe(input)
    expect(input).toHaveValue('Draft text value')
  })
})
