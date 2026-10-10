import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuthValue } from '@/features/auth/AuthContext'
import ContactPage from '@/features/pages/ContactPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { SiteSettings, User } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Sample Shop',
  description: '',
  address: '12 Example Street, Springfield',
  phone: '+1 555 010 0400',
  email: 'info@example.com',
  facebook: 'https://www.facebook.com/ornekmagaza',
  instagram: '@ornekmagaza',
  pinterest: '',
  about_text: '',
  contact_text: 'We answer on weekdays between 09:00 and 18:00.',
}

function renderContact(user: User | null = null, auth?: Partial<AuthValue>) {
  return renderWithProviders(<ContactPage />, { route: '/contact', user, auth })
}

function submitButton() {
  return screen.getByRole('button', { name: t('pages.form_submit') })
}

describe('ContactPage', () => {
  beforeEach(() => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the site details and contact text from the mocked API', async () => {
    renderContact()
    expect(await screen.findByText(site.contact_text)).toBeInTheDocument()
    expect(screen.getByText(site.address)).toBeInTheDocument()
    expect(screen.getByText(site.phone)).toBeInTheDocument()
    expect(screen.getByText(site.email)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: site.facebook })).toHaveAttribute(
      'href',
      site.facebook,
    )
    // A social value that is not a web address is shown as text, not as a link.
    expect(screen.getByText(site.instagram)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: site.instagram })).toBeNull()
  })

  it('test_contact_posts_exact_body', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ id: 7 })
    renderContact()
    await userEvent.type(screen.getByLabelText(t('pages.form_name')), 'Jane Doe')
    await userEvent.type(screen.getByLabelText(t('pages.form_email')), 'jane.doe@example.com')
    await userEvent.type(screen.getByLabelText(t('pages.form_phone')), '+1 555 010 0100')
    await userEvent.type(screen.getByLabelText(t('pages.form_subject')), 'About an order')
    await userEvent.type(
      screen.getByLabelText(t('pages.form_body')),
      'I would like some information about my order.',
    )
    await userEvent.click(submitButton())
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/contact', {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1 555 010 0100',
        subject: 'About an order',
        body: 'I would like some information about my order.',
      }),
    )
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('test_contact_prefills_logged_in_user', () => {
    renderContact(testCustomer)
    expect(screen.getByLabelText(t('pages.form_name'))).toHaveValue(testCustomer.full_name)
    expect(screen.getByLabelText(t('pages.form_email'))).toHaveValue(testCustomer.email)
  })

  it('test_contact_shows_thanks_after_success', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ id: 7 })
    renderContact(testCustomer)
    await userEvent.type(screen.getByLabelText(t('pages.form_subject')), 'About an order')
    await userEvent.type(screen.getByLabelText(t('pages.form_body')), 'Teşekkürler.')
    await userEvent.click(submitButton())
    expect(await screen.findByRole('status')).toHaveTextContent(t('pages.form_thanks'))
    expect(screen.queryByRole('button', { name: t('pages.form_submit') })).toBeNull()
  })

  it('test_contact_validation_error_shows_message', async () => {
    const error = new ApiError(422, 'validation_error', { errors: [] })
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderContact(testCustomer)
    await userEvent.type(screen.getByLabelText(t('pages.form_subject')), 'About an order')
    await userEvent.type(screen.getByLabelText(t('pages.form_body')), 'Teşekkürler.')
    await userEvent.click(submitButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })

  it('test_contact_requires_every_field', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ id: 7 })
    renderContact()
    await userEvent.click(submitButton())
    expect(await screen.findAllByText(t('pages.field_required'))).toHaveLength(4)
    expect(post).not.toHaveBeenCalled()
  })

  it('shows the loading text instead of the form while the session is checked', async () => {
    renderContact(null, { loading: true })
    expect(await screen.findByText(site.address)).toBeInTheDocument()
    expect(screen.getByText(t('common.loading'))).toBeInTheDocument()
    expect(screen.queryByLabelText(t('pages.form_name'))).toBeNull()
  })
})
