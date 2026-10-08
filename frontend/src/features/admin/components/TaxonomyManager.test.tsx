import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxonomyManager } from '@/features/admin/components/TaxonomyManager'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { Taxonomy } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const electronics: Taxonomy = { id: 3, name: 'Elektronik', description: 'Cihazlar ve aksesuarlar' }

function renderManager() {
  return renderWithProviders(
    <TaxonomyManager title={t('admintaxonomy.categories_title')} endpoint="/admin/categories" />,
    { route: '/admin/categories', user: testAdmin },
  )
}

describe('TaxonomyManager', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the rows loaded from GET /admin/categories', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue([electronics])
    renderManager()
    expect(await screen.findByText('Elektronik')).toBeInTheDocument()
    expect(screen.getByText('Cihazlar ve aksesuarlar')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/categories')
  })

  it('test_manager_create_posts_name_and_description', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([])
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ id: 4, name: 'Giyim', description: 'Kıyafetler' })
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('admintaxonomy.create') }))
    await userEvent.type(screen.getByLabelText(t('admintaxonomy.name')), 'Giyim')
    await userEvent.type(screen.getByLabelText(t('admintaxonomy.description')), 'Kıyafetler')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/admin/categories', {
        name: 'Giyim',
        description: 'Kıyafetler',
      }),
    )
  })

  it('test_manager_edit_puts_to_item_endpoint', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([electronics])
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ ...electronics, name: 'Elektronik ve Bilgisayar' })
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('common.edit') }))
    const name = screen.getByLabelText(t('admintaxonomy.name'))
    expect(name).toHaveValue('Elektronik')
    await userEvent.clear(name)
    await userEvent.type(name, 'Elektronik ve Bilgisayar')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/admin/categories/3', {
        name: 'Elektronik ve Bilgisayar',
        description: 'Cihazlar ve aksesuarlar',
      }),
    )
  })

  it('test_manager_name_taken_shows_field_error', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([])
    const post = vi.spyOn(api, 'post').mockRejectedValue(new ApiError(409, 'name_taken'))
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('admintaxonomy.create') }))
    await userEvent.type(screen.getByLabelText(t('admintaxonomy.name')), 'Elektronik')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.name_taken'))
    expect(screen.getByLabelText(t('admintaxonomy.name'))).toHaveAttribute('aria-invalid', 'true')
    // The dialog stays open so that the admin can choose another name.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('test_manager_empty_name_is_not_sent', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([])
    const post = vi.spyOn(api, 'post').mockResolvedValue(undefined)
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('admintaxonomy.create') }))
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    expect(await screen.findByText(t('admintaxonomy.name_required'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('test_manager_delete_has_dependencies_message', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([electronics])
    const del = vi.spyOn(api, 'delete').mockRejectedValue(new ApiError(409, 'has_dependencies'))
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('common.delete') }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: t('common.delete') }),
    )
    await waitFor(() => expect(del).toHaveBeenCalledWith('/admin/categories/3'))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.has_dependencies'))
  })

  it('deletes the row after confirmation and then reloads the list', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValueOnce([electronics]).mockResolvedValue([])
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderManager()
    await userEvent.click(await screen.findByRole('button', { name: t('common.delete') }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: t('common.delete') }),
    )
    await waitFor(() => expect(del).toHaveBeenCalledWith('/admin/categories/3'))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(t('common.empty'))).toBeInTheDocument()
  })
})
