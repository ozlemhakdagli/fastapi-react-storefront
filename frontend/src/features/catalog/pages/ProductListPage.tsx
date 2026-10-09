import { useSearchParams } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { type FilterName, ProductFilters } from '@/features/catalog/components/ProductFilters'
import { type ProductQuery, type ProductSort, useProducts } from '@/features/catalog/hooks/useProducts'
import { useBrands, useCategories } from '@/features/catalog/hooks/useTaxonomy'
import { t } from '@/lib/i18n'

const SORTS: readonly ProductSort[] = ['newest', 'price_asc', 'price_desc']

type ListFilters = ProductQuery & { page: number }

/** A positive integer from the URL, or undefined (no filter) for anything else. */
function parseId(value: string | null): number | undefined {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : undefined
}

/** The list state lives in the URL; invalid values fall back to "no filter" or page 1. */
function readFilters(params: URLSearchParams): ListFilters {
  const page = Number(params.get('page'))
  return {
    category_id: parseId(params.get('category_id')),
    brand_id: parseId(params.get('brand_id')),
    q: params.get('q')?.trim() || undefined,
    sort: SORTS.find((option) => option === params.get('sort')),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const products = useProducts(filters)
  const categories = useCategories()
  const brands = useBrands()

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

  return (
    <div className="grid gap-6">
      <PageHeader title={t('catalog.list_title')} />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ProductFilters
          categories={categories.data ?? []}
          brands={brands.data ?? []}
          categoryId={filters.category_id}
          brandId={filters.brand_id}
          q={filters.q}
          sort={filters.sort}
          onChange={changeFilter}
        />
        <div className="grid content-start gap-6">
          <ErrorNotice error={products.error} />
          {products.isPending ? <LoadingNotice /> : null}
          {products.data && products.data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('catalog.list_empty')}</p>
          ) : null}
          {products.data && products.data.total > 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('catalog.list_count', { count: products.data.total })}
            </p>
          ) : null}
          {products.data && products.data.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
          {products.data ? (
            <Pagination
              page={filters.page}
              pageSize={products.data.page_size}
              total={products.data.total}
              onChange={changePage}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
