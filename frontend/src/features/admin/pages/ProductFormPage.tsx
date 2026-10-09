import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { NativeSelect } from '@/components/NativeSelect'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductImagesPanel } from '@/features/admin/components/ProductImagesPanel'
import {
  type ProductInput,
  useAdminProduct,
  useDeleteAdminProduct,
  useSaveAdminProduct,
} from '@/features/admin/hooks/useAdminProducts'
import { useAdminTaxonomyOptions } from '@/features/admin/hooks/useAdminTaxonomyOptions'
import { ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminProduct, Taxonomy } from '@/lib/types'

// Same limits as the API (docs/api.md). The database is the final check.
const SKU_PATTERN = /^[A-Za-z0-9._-]{1,64}$/
// Up to 10 integer digits and 2 decimals: the NUMERIC(12,2) range.
const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/
// The server refuses prices above this (the largest total still fits an order, see the API reference).
const MAX_PRICE = 1_000_000

function isValidMoney(text: string): boolean {
  return MONEY_PATTERN.test(text) && Number(text) <= MAX_PRICE
}
const MAX_STOCK = 1000000

// Native selects, styled like the inputs: the shadcn Select needs browser APIs that jsdom lacks.
// The inputs hold text. Money and stock stay text until they are sent.
interface FormValues {
  sku: string
  name: string
  /** Empty string means no brand. */
  brand_id: string
  /** Empty string means no category. */
  category_id: string
  short_description: string
  description: string
  price: string
  cost_price: string
  stock: string
  is_new: boolean
  is_active: boolean
}

type FieldName = 'sku' | 'name' | 'price' | 'cost_price' | 'stock'
type FieldErrors = Partial<Record<FieldName, string>>

const EMPTY_VALUES: FormValues = {
  sku: '',
  name: '',
  brand_id: '',
  category_id: '',
  short_description: '',
  description: '',
  price: '',
  cost_price: '',
  stock: '0',
  is_new: false,
  is_active: true,
}

function valuesFrom(product: AdminProduct): FormValues {
  return {
    sku: product.sku,
    name: product.name,
    brand_id: product.brand ? String(product.brand.id) : '',
    category_id: product.category ? String(product.category.id) : '',
    short_description: product.short_description,
    description: product.description,
    price: product.price,
    cost_price: product.cost_price ?? '',
    stock: String(product.stock),
    is_new: product.is_new,
    is_active: product.is_active,
  }
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}
  const sku = values.sku.trim()
  if (sku === '') errors.sku = t('adminproducts.error_required')
  else if (!SKU_PATTERN.test(sku)) errors.sku = t('adminproducts.error_sku_format')
  if (values.name.trim() === '') errors.name = t('adminproducts.error_required')
  const price = normalizeMoney(values.price)
  if (price === '') errors.price = t('adminproducts.error_required')
  else if (!isValidMoney(price)) errors.price = t('adminproducts.error_money')
  const cost = normalizeMoney(values.cost_price)
  if (cost !== '' && !isValidMoney(cost)) errors.cost_price = t('adminproducts.error_money')
  const stock = values.stock.trim()
  if (!/^\d+$/.test(stock) || Number(stock) > MAX_STOCK) {
    errors.stock = t('adminproducts.error_stock')
  }
  return errors
}

/** Trim a typed amount and accept the Turkish decimal comma ("1299,90") as a dot. */
function normalizeMoney(text: string): string {
  return text.trim().replace(',', '.')
}

/** The request body of POST and PUT: every ProductIn field. Money stays a string. */
function toInput(values: FormValues): ProductInput {
  const cost = normalizeMoney(values.cost_price)
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    brand_id: values.brand_id === '' ? null : Number(values.brand_id),
    category_id: values.category_id === '' ? null : Number(values.category_id),
    short_description: values.short_description.trim(),
    description: values.description.trim(),
    price: normalizeMoney(values.price),
    cost_price: cost === '' ? null : cost,
    stock: Number(values.stock.trim()),
    is_new: values.is_new,
    is_active: values.is_active,
  }
}

export default function ProductFormPage() {
  const { id } = useParams()
  // undefined on /admin/products/new, a number on /admin/products/:id.
  const productId = id === undefined ? undefined : Number(id)
  const isNew = productId === undefined
  const product = useAdminProduct(productId)
  const taxonomies = useAdminTaxonomyOptions()

  return (
    <div className="grid gap-6">
      <PageHeader
        title={isNew ? t('adminproducts.new_title') : t('adminproducts.edit_title')}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/products">{t('adminproducts.back_to_list')}</Link>
          </Button>
        }
      />
      {!isNew && product.isPending ? (
        <LoadingNotice />
      ) : null}
      {!isNew ? <ErrorNotice error={product.isError ? product.error : null} /> : null}
      {isNew || product.data ? (
        <>
          {/* A new key per product, so that the form starts again from the loaded values. */}
          <ProductForm
            key={productId ?? 'new'}
            productId={productId}
            product={product.data}
            categories={taxonomies.categories.data ?? []}
            brands={taxonomies.brands.data ?? []}
          />
          {productId !== undefined && product.data ? (
            <ProductImagesPanel productId={productId} images={product.data.images} />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

interface ProductFormProps {
  /** undefined while creating a product. */
  productId: number | undefined
  /** The loaded product in edit mode. */
  product: AdminProduct | undefined
  categories: Taxonomy[]
  brands: Taxonomy[]
}

function ProductForm({ productId, product, categories, brands }: ProductFormProps) {
  const navigate = useNavigate()
  const save = useSaveAdminProduct(productId)
  const remove = useDeleteAdminProduct()
  const [values, setValues] = useState<FormValues>(() =>
    product ? valuesFrom(product) : EMPTY_VALUES,
  )
  // The version of the product that this form is based on. The server refuses a save when the
  // product changed since (for example a sale reduced the stock), instead of overwriting it.
  const [version, setVersion] = useState(product?.updated_at)
  // Field errors appear after the first submit attempt, then follow the inputs (as on checkout).
  const [attempted, setAttempted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Only the most recent action (save or delete) may show its error or its notice.
  const [lastAction, setLastAction] = useState<'save' | 'delete' | null>(null)
  const saveError = lastAction === 'save' ? save.error : null
  const deleteError = lastAction === 'delete' ? remove.error : null
  const saved = lastAction === 'save' && save.isSuccess

  const errors: FieldErrors = attempted ? validate(values) : {}
  // A duplicate SKU is shown on the SKU field, so it is not repeated in the page notice.
  const skuTaken = saveError instanceof ApiError && saveError.code === 'sku_taken'
  const skuError = skuTaken ? errorMessage(saveError) : errors.sku
  const productChanged = saveError instanceof ApiError && saveError.code === 'product_changed'
  const deleteBlocked = deleteError instanceof ApiError && deleteError.code === 'has_dependencies'

  function setValue<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    if (Object.keys(validate(values)).length > 0) return
    setLastAction('save')
    const input = toInput(values)
    if (productId !== undefined && version !== undefined) input.expected_updated_at = version
    save.mutate(input, {
      onSuccess: (saved) => {
        setVersion(saved.updated_at)
        // A new product opens on its own page, where its images can be added.
        if (productId === undefined) navigate(`/admin/products/${saved.id}`, { replace: true })
      },
    })
  }

  function handleDelete() {
    setConfirmOpen(false)
    if (productId === undefined) return
    setLastAction('delete')
    remove.mutate(productId, {
      onSuccess: () => navigate('/admin/products', { replace: true }),
    })
  }

  return (
    <div className="grid gap-6">
      {/* noValidate: the messages come from our own validation, not from the browser. */}
      <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
        <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
          <FormField label={t('adminproducts.field_sku')} htmlFor="product-sku" error={skuError}>
            <Input
              id="product-sku"
              name="sku"
              required
              maxLength={64}
              value={values.sku}
              aria-invalid={skuError ? true : undefined}
              onChange={(event) => setValue('sku', event.target.value)}
            />
          </FormField>
          <FormField
            label={t('adminproducts.field_name')}
            htmlFor="product-name"
            error={errors.name}
          >
            <Input
              id="product-name"
              name="name"
              required
              maxLength={200}
              value={values.name}
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => setValue('name', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminproducts.field_brand')} htmlFor="product-brand">
            <NativeSelect
              id="product-brand"
              value={values.brand_id}
              onChange={(event) => setValue('brand_id', event.target.value)}
            >
              <option value="">{t('adminproducts.no_selection')}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label={t('adminproducts.field_category')} htmlFor="product-category">
            <NativeSelect
              id="product-category"
              value={values.category_id}
              onChange={(event) => setValue('category_id', event.target.value)}
            >
              <option value="">{t('adminproducts.no_selection')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField
            label={t('adminproducts.field_price')}
            htmlFor="product-price"
            error={errors.price}
          >
            <Input
              id="product-price"
              name="price"
              required
              inputMode="decimal"
              autoComplete="off"
              value={values.price}
              aria-invalid={errors.price ? true : undefined}
              onChange={(event) => setValue('price', event.target.value)}
            />
          </FormField>
          <FormField
            label={t('adminproducts.field_cost_price')}
            htmlFor="product-cost-price"
            error={errors.cost_price}
          >
            <Input
              id="product-cost-price"
              name="cost_price"
              inputMode="decimal"
              autoComplete="off"
              value={values.cost_price}
              aria-invalid={errors.cost_price ? true : undefined}
              onChange={(event) => setValue('cost_price', event.target.value)}
            />
          </FormField>
          <FormField
            label={t('adminproducts.field_stock')}
            htmlFor="product-stock"
            error={errors.stock}
          >
            <Input
              id="product-stock"
              name="stock"
              type="number"
              required
              min={0}
              max={MAX_STOCK}
              step={1}
              value={values.stock}
              aria-invalid={errors.stock ? true : undefined}
              onChange={(event) => setValue('stock', event.target.value)}
            />
          </FormField>
        </section>
        <section className="grid gap-4 rounded-xl border bg-card p-4">
          <FormField
            label={t('adminproducts.field_short_description')}
            htmlFor="product-short-description"
          >
            <Textarea
              id="product-short-description"
              name="short_description"
              rows={2}
              maxLength={500}
              value={values.short_description}
              onChange={(event) => setValue('short_description', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminproducts.field_description')} htmlFor="product-description">
            <Textarea
              id="product-description"
              name="description"
              rows={6}
              maxLength={5000}
              value={values.description}
              onChange={(event) => setValue('description', event.target.value)}
            />
          </FormField>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={values.is_new}
                onChange={(event) => setValue('is_new', event.target.checked)}
              />
              {t('adminproducts.field_is_new')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={values.is_active}
                onChange={(event) => setValue('is_active', event.target.checked)}
              />
              {t('adminproducts.field_is_active')}
            </label>
          </div>
        </section>
        <ErrorNotice error={skuTaken ? null : saveError} />
        {productChanged ? (
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {t('adminproducts.reload')}
          </Button>
        ) : null}
        {productId !== undefined && saved ? (
          <p role="status" className="border-border bg-muted rounded-md border px-3 py-2 text-sm">
            {t('adminproducts.saved')}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={save.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>

      {productId !== undefined ? (
        <section className="grid gap-3 rounded-xl border border-destructive/30 bg-card p-4">
          <ErrorNotice error={deleteError} />
          {deleteBlocked ? (
            <p className="text-muted-foreground text-sm">
              {t('adminproducts.delete_blocked_hint')}
            </p>
          ) : null}
          <div>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {t('adminproducts.delete_button')}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            title={t('adminproducts.delete_title')}
            description={t('adminproducts.delete_description')}
            confirmLabel={t('adminproducts.delete_confirm')}
            onConfirm={handleDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        </section>
      ) : null}
    </div>
  )
}
