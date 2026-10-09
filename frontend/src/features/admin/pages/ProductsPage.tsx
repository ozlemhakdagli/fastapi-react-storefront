import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Money } from '@/components/Money'
import { NativeSelect } from '@/components/NativeSelect'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ProductImage } from '@/components/ProductImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type AdminProductQuery, useAdminProducts } from '@/features/admin/hooks/useAdminProducts'
import { useAdminTaxonomyOptions } from '@/features/admin/hooks/useAdminTaxonomyOptions'
import { t } from '@/lib/i18n'
import type { AdminProduct } from '@/lib/types'

// Native selects, styled like the inputs: the shadcn Select needs browser APIs that jsdom lacks.
type FilterName = 'q' | 'category_id' | 'brand_id' | 'is_active'

/** A positive integer from the URL, or undefined (no filter) for anything else. */
function parseId(value: string | null): number | undefined {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : undefined
}

/** `true` or `false` from the URL; anything else means no filter. */
function parseActive(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/** The list state lives in the URL, so that a reload or the back button keeps the filters. */
function readFilters(params: URLSearchParams): AdminProductQuery & { page: number } {
  const page = Number(params.get('page'))
  return {
    q: params.get('q')?.trim() || undefined,
    category_id: parseId(params.get('category_id')),
    brand_id: parseId(params.get('brand_id')),
    is_active: parseActive(params.get('is_active')),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const products = useAdminProducts(filters)
  const taxonomies = useAdminTaxonomyOptions()

  function changeFilter(name: FilterName, value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set(name, value)
      else next.delete(name)
      next.delete('page') // a changed filter starts again on the first page
      return next
    })
  }

  function changePage(page: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (page > 1) next.set('page', String(page))
      else next.delete('page')
      return next
    })
  }

  const columns: Column<AdminProduct>[] = [
    {
      key: 'image',
      header: t('adminproducts.column_image'),
      cell: (product) => (
        <ProductImage
          name={product.name}
          imageUrl={product.image_url}
          category={product.category}
          className="size-12 rounded-md"
        />
      ),
    },
    { key: 'sku', header: t('adminproducts.column_sku'), cell: (product) => product.sku },
    { key: 'name', header: t('adminproducts.column_name'), cell: (product) => product.name },
    {
      key: 'price',
      header: t('adminproducts.column_price'),
      cell: (product) => <Money value={product.price} />,
    },
    { key: 'stock', header: t('adminproducts.column_stock'), cell: (product) => product.stock },
    {
      key: 'active',
      header: t('adminproducts.column_active'),
      cell: (product) => (
        <Badge variant={product.is_active ? 'secondary' : 'outline'}>
          {product.is_active ? t('adminproducts.active_yes') : t('adminproducts.active_no')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-right',
      cell: (product) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/products/${product.id}`}>{t('common.edit')}</Link>
        </Button>
      ),
    },
  ]

  const activeValue = filters.is_active === undefined ? '' : String(filters.is_active)

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t('adminproducts.list_title')}
        actions={
          <Button asChild>
            <Link to="/admin/products/new">{t('adminproducts.new_button')}</Link>
          </Button>
        }
      />
      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
        {/* Keyed by the URL value: the draft resets when the URL changes (e.g. browser back). */}
        <SearchForm
          key={filters.q ?? ''}
          initialQuery={filters.q ?? ''}
          onSubmit={(value) => changeFilter('q', value)}
        />
        <FormField label={t('adminproducts.filter_category')} htmlFor="filter-category">
          <NativeSelect
            id="filter-category"
            value={filters.category_id ?? ''}
            onChange={(event) => changeFilter('category_id', event.target.value)}
          >
            <option value="">{t('adminproducts.all_categories')}</option>
            {(taxonomies.categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label={t('adminproducts.filter_brand')} htmlFor="filter-brand">
          <NativeSelect
            id="filter-brand"
            value={filters.brand_id ?? ''}
            onChange={(event) => changeFilter('brand_id', event.target.value)}
          >
            <option value="">{t('adminproducts.all_brands')}</option>
            {(taxonomies.brands.data ?? []).map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label={t('adminproducts.filter_active')} htmlFor="filter-active">
          <NativeSelect
            id="filter-active"
            value={activeValue}
            onChange={(event) => changeFilter('is_active', event.target.value)}
          >
            <option value="">{t('adminproducts.all_statuses')}</option>
            <option value="true">{t('adminproducts.active_yes')}</option>
            <option value="false">{t('adminproducts.active_no')}</option>
          </NativeSelect>
        </FormField>
      </div>
      <ErrorNotice error={products.error} />
      {products.isPending ? (
        <LoadingNotice />
      ) : null}
      {products.data ? (
        <>
          <DataTable
            columns={columns}
            rows={products.data.items}
            rowKey={(product) => product.id}
            emptyText={t('adminproducts.list_empty')}
          />
          <Pagination
            page={filters.page}
            pageSize={products.data.page_size}
            total={products.data.total}
            onChange={changePage}
          />
        </>
      ) : null}
    </div>
  )
}

function SearchForm({
  initialQuery,
  onSubmit,
}: {
  initialQuery: string
  onSubmit: (value: string) => void
}) {
  const [draft, setDraft] = useState(initialQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(draft.trim())
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="grid grid-cols-[1fr_auto] items-end gap-2"
    >
      <FormField label={t('adminproducts.filter_search')} htmlFor="filter-q">
        <Input
          id="filter-q"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </FormField>
      <Button type="submit">{t('common.search')}</Button>
    </form>
  )
}
