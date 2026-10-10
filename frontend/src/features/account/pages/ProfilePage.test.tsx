import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/features/auth/AuthContext'
import ProfilePage from '@/features/account/pages/ProfilePage'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import { renderWithProviders, testCustomer } from '@/test/utils'

// A stored token makes the real AuthProvider load the user from GET /auth/me.
function renderProfile() {
  localStorage.setItem('ecommerce.token', 'stored')
  const get = vi.spyOn(api, 'get').mockResolvedValue(testCustomer)
  renderWithProviders(
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>,
    { route: '/account' },
  )
  return { get }
}

async function fillPasswordForm(values: { current: string; next: string; confirm: string }) {
  await userEvent.type(screen.getByLabelText(t('profile.current_password')), values.current)
  await userEvent.type(screen.getByLabelText(t('profile.new_password')), values.next)
  await userEvent.type(screen.getByLabelText(t('profile.new_password_confirm')), values.confirm)
}

describe('ProfilePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the profile loaded from /auth/me with the email read-only', async () => {
    const { get } = renderProfile()
    expect(await screen.findByLabelText(t('profile.full_name'))).toHaveValue(testCustomer.full_name)
    expect(screen.getByLabelText(t('profile.phone'))).toHaveValue(testCustomer.phone)
    expect(screen.getByLabelText(t('profile.address'))).toHaveValue(testCustomer.address)
    const email = screen.getByLabelText(t('profile.email'))
    expect(email).toHaveValue(testCustomer.email)
    expect(email).toHaveAttribute('readonly')
    expect(get).toHaveBeenCalledWith('/auth/me')
  })

  it('test_profile_save_calls_patch_with_editable_fields_only', async () => {
    const { get } = renderProfile()
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ ...testCustomer, full_name: 'Jane Roe' })
    const name = await screen.findByLabelText(t('profile.full_name'))
    await userEvent.clear(name)
    await userEvent.type(name, 'Jane Roe')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/auth/me', {
        full_name: 'Jane Roe',
        phone: testCustomer.phone,
        address: testCustomer.address,
      }),
    )
    // refresh() reloads the user from /auth/me once the save succeeded.
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('status')).toHaveTextContent(t('profile.saved'))
  })

  it('sends null for an emptied phone or address so the stored value is cleared', async () => {
    renderProfile()
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(testCustomer)
    await userEvent.clear(await screen.findByLabelText(t('profile.phone')))
    await userEvent.clear(screen.getByLabelText(t('profile.address')))
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/auth/me', {
        full_name: testCustomer.full_name,
        phone: null,
        address: null,
      }),
    )
  })

  it('test_change_password_wrong_password_shows_error', async () => {
    renderProfile()
    await screen.findByLabelText(t('profile.full_name'))
    const post = vi.spyOn(api, 'post').mockRejectedValue(new ApiError(400, 'wrong_password'))
    await fillPasswordForm({ current: 'EskiPassw0rd', next: 'YeniPassw0rd', confirm: 'YeniPassw0rd' })
    await userEvent.click(screen.getByRole('button', { name: t('profile.password_submit') }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/auth/change-password', {
        current_password: 'EskiPassw0rd',
        new_password: 'YeniPassw0rd',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.wrong_password'))
    expect(localStorage.getItem('ecommerce.token')).toBe('stored')
  })

  it('a password change stores the new token and keeps the user logged in', async () => {
    const { get } = renderProfile()
    await screen.findByLabelText(t('profile.full_name'))
    vi.spyOn(api, 'post').mockResolvedValue({
      access_token: 'new-token',
      token_type: 'bearer',
      user: testCustomer,
    })
    await fillPasswordForm({ current: 'EskiPassw0rd', next: 'YeniPassw0rd', confirm: 'YeniPassw0rd' })
    await userEvent.click(screen.getByRole('button', { name: t('profile.password_submit') }))
    expect(await screen.findByRole('status')).toHaveTextContent(t('profile.password_changed'))
    expect(localStorage.getItem('ecommerce.token')).toBe('new-token')
    // refresh() loads the user again with the new token; the form stays on the page.
    expect(get).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText(t('profile.full_name'))).toHaveValue(testCustomer.full_name)
  })

  it('new password confirmation mismatch blocks the request', async () => {
    renderProfile()
    await screen.findByLabelText(t('profile.full_name'))
    const post = vi.spyOn(api, 'post').mockResolvedValue(undefined)
    await fillPasswordForm({ current: 'EskiPassw0rd', next: 'YeniPassw0rd', confirm: 'YeniPassw0rd2' })
    await userEvent.click(screen.getByRole('button', { name: t('profile.password_submit') }))
    expect(await screen.findByText(t('profile.password_mismatch'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})
