import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/SearchForm'
import { t } from '@/lib/i18n'

describe('SearchForm', () => {
  it('starts with the initial query', () => {
    render(<SearchForm id="q" label="Arama metni" initialQuery="ssd" onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Arama metni')).toHaveValue('ssd')
  })

  it('submits the trimmed text', async () => {
    const onSubmit = vi.fn()
    render(<SearchForm id="q" label="Arama metni" initialQuery="" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Arama metni'), '  usb  ')
    await userEvent.click(screen.getByRole('button', { name: t('common.search') }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('usb')
  })
})
