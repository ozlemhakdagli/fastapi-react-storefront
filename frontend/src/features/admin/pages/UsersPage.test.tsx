import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersPage from '@/features/admin/pages/UsersPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Page, User } from '@/lib/types'
import { renderWithProviders, testAdmin, testCustomer } from '@/test/utils'

function page(items: User[]): Page<User> {
  return { items, total: items.length, page: 1, page_size: 20 }
}

function renderUsers() {
  return renderWithProviders(<UsersPage />, { user: testAdmin })
}

describe('UsersPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_users_renders_rows_from_api', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer, testAdmin]))
    renderUsers()
    expect(await screen.findByText(testCustomer.email)).toBeInTheDocument()
    expect(screen.getByText(testAdmin.email)).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(
      '/admin/users',
      expect.objectContaining({ page: 1, page_size: 20 }),
    )
  })

  it('test_users_filter_params', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer]))
    renderUsers()
    await screen.findByText(testCustomer.email)
    await userEvent.selectOptions(screen.getByLabelText(t('adminusers.filter_role')), 'admin')
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/users',
        expect.objectContaining({ role: 'admin', page: 1 }),
      ),
    )
    await userEvent.type(screen.getByLabelText(t('adminusers.filter_search')), 'ayse')
    await userEvent.click(screen.getByRole('button', { name: t('common.search') }))
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/users',
        expect.objectContaining({ role: 'admin', q: 'ayse', page: 1 }),
      ),
    )
  })

  it('test_users_create_posts_body', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer]))
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...testCustomer, id: 9 })
    renderUsers()
    await userEvent.click(await screen.findByRole('button', { name: t('adminusers.new_user') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_email')),
      'yeni@example.com',
    )
    await userEvent.type(within(dialog).getByLabelText(t('adminusers.field_password')), 'Gizli1234')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_full_name')),
      'Mehmet Kaya',
    )
    await userEvent.type(within(dialog).getByLabelText(t('adminusers.field_phone')), '05321112233')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_address')),
      'Moda Cad. 2, Kadıköy',
    )
    await userEvent.selectOptions(within(dialog).getByLabelText(t('adminusers.field_role')), 'admin')
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.create') }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/admin/users', {
        email: 'yeni@example.com',
        password: 'Gizli1234',
        full_name: 'Mehmet Kaya',
        role: 'admin',
        phone: '05321112233',
        address: 'Moda Cad. 2, Kadıköy',
      }),
    )
  })

  it('test_users_create_short_password_blocks_request', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer]))
    const post = vi.spyOn(api, 'post')
    renderUsers()
    await userEvent.click(await screen.findByRole('button', { name: t('adminusers.new_user') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_email')),
      'yeni@example.com',
    )
    await userEvent.type(within(dialog).getByLabelText(t('adminusers.field_password')), 'kisa')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_full_name')),
      'Mehmet Kaya',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.create') }))
    expect(await within(dialog).findByText(t('adminusers.password_too_short'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('test_users_create_email_taken_shown', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer]))
    const error = new ApiError(409, 'email_taken')
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderUsers()
    await userEvent.click(await screen.findByRole('button', { name: t('adminusers.new_user') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_email')),
      testCustomer.email,
    )
    await userEvent.type(within(dialog).getByLabelText(t('adminusers.field_password')), 'Gizli1234')
    await userEvent.type(
      within(dialog).getByLabelText(t('adminusers.field_full_name')),
      'Mehmet Kaya',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.create') }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(errorMessage(error))
  })

  it('test_users_edit_omits_empty_password', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([testCustomer]))
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(testCustomer)
    renderUsers()
    await userEvent.click(await screen.findByRole('button', { name: t('common.edit') }))
    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByLabelText(t('adminusers.field_full_name'))
    expect(name).toHaveValue(testCustomer.full_name)
    await userEvent.clear(name)
    await userEvent.type(name, 'Ayşe Demir')
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/admin/users/2', {
        full_name: 'Ayşe Demir',
        phone: testCustomer.phone,
        address: testCustomer.address,
        role: 'customer',
        is_active: true,
      }),
    )
    // The server rejects an explicit null password, so an empty field must not be sent at all.
    expect(patch.mock.calls[0][1]).not.toHaveProperty('password')
  })

  it('test_users_last_admin_error_shown', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([testAdmin]))
    const error = new ApiError(409, 'last_admin')
    const patch = vi.spyOn(api, 'patch').mockRejectedValue(error)
    renderUsers()
    await userEvent.click(await screen.findByRole('button', { name: t('common.edit') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByLabelText(t('adminusers.field_active')))
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.save') }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(errorMessage(error))
    expect(patch).toHaveBeenCalledWith(
      '/admin/users/1',
      expect.objectContaining({ is_active: false }),
    )
  })
})
