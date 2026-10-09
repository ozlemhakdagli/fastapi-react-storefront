import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import ProductFormPage from '@/features/admin/pages/ProductFormPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminProduct, Taxonomy } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const product: AdminProduct = {
  id: 5,
  sku: 'KL-100',
  name: 'Mekanik Klavye',
  short_description: 'Kırmızı anahtarlı',
  description: 'Tam boyut klavye.',
  price: '1299.90',
  cost_price: '800.00',
  stock: 4,
  is_new: true,
  is_active: true,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Klavyeler' },
  image_url: '/api/media/a.jpg',
  images: [
    { id: 11, url: '/api/media/a.jpg', position: 0 },
    { id: 12, url: '/api/media/b.jpg', position: 1 },
    { id: 13, url: '/api/media/c.jpg', position: 2 },
  ],
  created_at: '2026-10-08T12:00:00Z',
  updated_at: '2026-10-08T12:00:00Z',
}

const categories: Taxonomy[] = [
  { id: 1, name: 'Klavyeler', description: '' },
  { id: 2, name: 'Fareler', description: '' },
]
const brands: Taxonomy[] = [{ id: 7, name: 'Logitech', description: '' }]

// Every GET that the edit page makes.
const editResponses = {
  '/admin/products/5': product,
  '/admin/categories': categories,
  '/admin/brands': brands,
}

/** Answers each GET by its path; an unexpected path fails the test. */
function mockGet(responses: Record<string, unknown>) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (!(path in responses)) throw new Error(`unexpected GET ${path}`)
    return responses[path]
  })
}

/** Shows the router location so that tests can read the URL. */
function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

// Without a <Route>, useParams() is empty, so the page is in create mode.
function renderNew() {
  return renderWithProviders(
    <>
      <ProductFormPage />
      <LocationProbe />
    </>,
    { route: '/admin/products/new', user: testAdmin },
  )
}

function renderEdit() {
  return renderWithProviders(<ProductFormPage />, {
    route: '/admin/products/5',
    path: '/admin/products/:id',
    user: testAdmin,
  })
}

/** The three fields that every create needs. */
async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(t('adminproducts.field_sku')), 'KL-100')
  await userEvent.type(screen.getByLabelText(t('adminproducts.field_name')), 'Mekanik Klavye')
  await userEvent.type(screen.getByLabelText(t('adminproducts.field_price')), '1299.90')
}

describe('ProductFormPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the product fields loaded from the API', async () => {
    mockGet(editResponses)
    renderEdit()
    expect(await screen.findByLabelText(t('adminproducts.field_sku'))).toHaveValue('KL-100')
    expect(screen.getByLabelText(t('adminproducts.field_name'))).toHaveValue('Mekanik Klavye')
    expect(screen.getByLabelText(t('adminproducts.field_price'))).toHaveValue('1299.90')
    expect(screen.getByLabelText(t('adminproducts.field_cost_price'))).toHaveValue('800.00')
    expect(screen.getByLabelText(t('adminproducts.field_stock'))).toHaveValue(4)
    expect(screen.getByLabelText(t('adminproducts.field_is_new'))).toBeChecked()
    expect(screen.getByLabelText(t('adminproducts.field_is_active'))).toBeChecked()
    // The options arrive after the product, and the selects follow them.
    await waitFor(() =>
      expect(screen.getByLabelText(t('adminproducts.field_brand'))).toHaveValue('7'),
    )
    expect(screen.getByLabelText(t('adminproducts.field_category'))).toHaveValue('1')
  })

  it('test_create_posts_exact_body_with_price_as_string', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...product, id: 42 })
    renderNew()
    await screen.findByRole('option', { name: 'Logitech' })
    await fillRequiredFields()
    await userEvent.selectOptions(screen.getByLabelText(t('adminproducts.field_brand')), '7')
    await userEvent.selectOptions(screen.getByLabelText(t('adminproducts.field_category')), '1')
    await userEvent.type(
      screen.getByLabelText(t('adminproducts.field_short_description')),
      'Kırmızı anahtarlı',
    )
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_description')), 'Tam boyut.')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_cost_price')), '800.00')
    await userEvent.clear(screen.getByLabelText(t('adminproducts.field_stock')))
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_stock')), '4')
    await userEvent.click(screen.getByLabelText(t('adminproducts.field_is_new')))
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post).toHaveBeenCalledWith('/admin/products', {
      sku: 'KL-100',
      name: 'Mekanik Klavye',
      brand_id: 7,
      category_id: 1,
      short_description: 'Kırmızı anahtarlı',
      description: 'Tam boyut.',
      price: '1299.90',
      cost_price: '800.00',
      stock: 4,
      is_new: true,
      is_active: true,
    })
    // After the create, the page opens the new product so that its images can be added.
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/admin/products/42'),
    )
  })

  it('accepts a Turkish decimal comma and sends the amounts with a dot', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...product, id: 42 })
    renderNew()
    await screen.findByRole('option', { name: 'Logitech' })
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_sku')), 'KL-100')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_name')), 'Mekanik Klavye')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_price')), '1299,90')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_cost_price')), '800,5')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0][1]).toMatchObject({ price: '1299.90', cost_price: '800.5' })
  })

  it('sends an empty cost price and no brand or category as null', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...product, id: 42 })
    renderNew()
    await screen.findByRole('option', { name: 'Logitech' })
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0][1]).toMatchObject({
      brand_id: null,
      category_id: null,
      cost_price: null,
    })
  })

  it('blocks the save when the price has more than two decimals', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const post = vi.spyOn(api, 'post').mockResolvedValue(product)
    renderNew()
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_sku')), 'KL-100')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_name')), 'Mekanik Klavye')
    await userEvent.type(screen.getByLabelText(t('adminproducts.field_price')), '12.999')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    expect(await screen.findByText(t('adminproducts.error_money'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('test_edit_loads_product_and_puts_full_body', async () => {
    mockGet(editResponses)
    const put = vi.spyOn(api, 'put').mockResolvedValue(product)
    renderEdit()
    const name = await screen.findByLabelText(t('adminproducts.field_name'))
    await userEvent.clear(name)
    await userEvent.type(name, 'Mekanik Klavye V2')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    expect(put).toHaveBeenCalledWith('/admin/products/5', {
      sku: 'KL-100',
      name: 'Mekanik Klavye V2',
      brand_id: 7,
      category_id: 1,
      short_description: 'Kırmızı anahtarlı',
      description: 'Tam boyut klavye.',
      price: '1299.90',
      cost_price: '800.00',
      stock: 4,
      is_new: true,
      is_active: true,
      expected_updated_at: product.updated_at,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(t('adminproducts.saved'))
  })

  it('test_each_save_sends_the_version_returned_by_the_previous_one', async () => {
    mockGet(editResponses)
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValueOnce({ ...product, updated_at: '2026-10-08T12:30:00Z' })
      .mockResolvedValueOnce({ ...product, updated_at: '2026-10-08T12:45:00Z' })
    renderEdit()
    await screen.findByLabelText(t('adminproducts.field_name'))
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    await screen.findByRole('status')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(put).toHaveBeenCalledTimes(2))
    expect(put.mock.calls[0][1]).toMatchObject({ expected_updated_at: product.updated_at })
    expect(put.mock.calls[1][1]).toMatchObject({ expected_updated_at: '2026-10-08T12:30:00Z' })
  })

  it('test_changed_product_error_keeps_the_draft_and_offers_a_reload', async () => {
    mockGet(editResponses)
    const error = new ApiError(409, 'product_changed')
    vi.spyOn(api, 'put').mockRejectedValue(error)
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    renderEdit()
    const name = await screen.findByLabelText(t('adminproducts.field_name'))
    await userEvent.clear(name)
    await userEvent.type(name, 'Taslak ad')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    expect(screen.getByLabelText(t('adminproducts.field_name'))).toHaveValue('Taslak ad')
    await userEvent.click(screen.getByRole('button', { name: t('adminproducts.reload') }))
    expect(reload).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('test_creating_a_product_sends_no_version', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...product, id: 42 })
    renderNew()
    await screen.findByRole('option', { name: 'Logitech' })
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0][1]).not.toHaveProperty('expected_updated_at')
  })

  it('test_sku_taken_error_is_shown_on_field', async () => {
    mockGet({ '/admin/categories': categories, '/admin/brands': brands })
    const error = new ApiError(409, 'sku_taken')
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderNew()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(errorMessage(error))
    const sku = screen.getByLabelText(t('adminproducts.field_sku'))
    expect(sku).toHaveAttribute('aria-invalid', 'true')
    // The message sits inside the SKU field, not in a page-level notice.
    expect(sku.parentElement).toContainElement(alert)
  })

  it('test_delete_has_dependencies_shows_hint', async () => {
    mockGet(editResponses)
    const error = new ApiError(409, 'has_dependencies')
    const remove = vi.spyOn(api, 'delete').mockRejectedValue(error)
    renderEdit()
    await userEvent.click(
      await screen.findByRole('button', { name: t('adminproducts.delete_button') }),
    )
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: t('adminproducts.delete_confirm') }),
    )
    await waitFor(() => expect(remove).toHaveBeenCalledWith('/admin/products/5'))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    expect(screen.getByText(t('adminproducts.delete_blocked_hint'))).toBeInTheDocument()
  })

  it('test_image_upload_sends_form_data_with_file_field', async () => {
    mockGet(editResponses)
    const upload = vi
      .spyOn(api, 'upload')
      .mockResolvedValue({ id: 14, url: '/api/media/d.jpg', position: 3 })
    renderEdit()
    const file = new File(['fake-jpeg'], 'kapak.jpg', { type: 'image/jpeg' })
    await userEvent.upload(await screen.findByLabelText(t('adminproducts.image_file')), file)
    await userEvent.click(screen.getByRole('button', { name: t('adminproducts.image_upload') }))
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    const [path, body] = upload.mock.calls[0]
    expect(path).toBe('/admin/products/5/images')
    expect(body).toBeInstanceOf(FormData)
    const sent = body.get('file') as File
    expect(sent.name).toBe('kapak.jpg')
    expect(sent.type).toBe('image/jpeg')
  })

  it('shows the translated message when an image upload is refused', async () => {
    mockGet(editResponses)
    const error = new ApiError(415, 'unsupported_media_type')
    vi.spyOn(api, 'upload').mockRejectedValue(error)
    renderEdit()
    const file = new File(['not-really-jpeg'], 'belge.jpg', { type: 'image/jpeg' })
    await userEvent.upload(await screen.findByLabelText(t('adminproducts.image_file')), file)
    await userEvent.click(screen.getByRole('button', { name: t('adminproducts.image_upload') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })

  it('test_image_move_up_sends_reordered_ids', async () => {
    mockGet(editResponses)
    const reorder = vi.spyOn(api, 'put').mockResolvedValue(product)
    renderEdit()
    const moveUp = t('adminproducts.image_move_up_label', { position: 2 })
    await userEvent.click(await screen.findByRole('button', { name: moveUp }))
    await waitFor(() => expect(reorder).toHaveBeenCalledTimes(1))
    expect(reorder).toHaveBeenCalledWith('/admin/products/5/images/order', {
      image_ids: [12, 11, 13],
    })
  })

  it('a successful move clears the message of an earlier refused upload', async () => {
    mockGet(editResponses)
    vi.spyOn(api, 'upload').mockRejectedValue(new ApiError(415, 'unsupported_media_type'))
    const reorder = vi.spyOn(api, 'put').mockResolvedValue(product)
    renderEdit()
    const file = new File(['not-really-jpeg'], 'belge.jpg', { type: 'image/jpeg' })
    await userEvent.upload(await screen.findByLabelText(t('adminproducts.image_file')), file)
    await userEvent.click(screen.getByRole('button', { name: t('adminproducts.image_upload') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.unsupported_media_type'))
    const moveUp = t('adminproducts.image_move_up_label', { position: 2 })
    await userEvent.click(screen.getByRole('button', { name: moveUp }))
    await waitFor(() => expect(reorder).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('saving clears the message of an earlier failed delete', async () => {
    mockGet(editResponses)
    vi.spyOn(api, 'delete').mockRejectedValue(new ApiError(409, 'has_dependencies'))
    vi.spyOn(api, 'put').mockResolvedValue(product)
    renderEdit()
    await userEvent.click(
      await screen.findByRole('button', { name: t('adminproducts.delete_button') }),
    )
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: t('adminproducts.delete_confirm') }),
    )
    expect(await screen.findByText(t('adminproducts.delete_blocked_hint'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    await waitFor(() =>
      expect(screen.queryByText(t('adminproducts.delete_blocked_hint'))).not.toBeInTheDocument(),
    )
  })

  it('shows the translated message when the product cannot be loaded', async () => {
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/admin/products/5') throw error
      return path === '/admin/categories' ? categories : brands
    })
    renderEdit()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
