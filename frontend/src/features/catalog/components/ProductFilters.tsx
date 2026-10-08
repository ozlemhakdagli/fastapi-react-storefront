import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductSort } from '@/features/catalog/hooks/useProducts'
import { t } from '@/lib/i18n'
import type { Taxonomy } from '@/lib/types'

export type FilterName = 'category_id' | 'brand_id' | 'sort' | 'q'

interface ProductFiltersProps {
  categories: Taxonomy[]
  brands: Taxonomy[]
  categoryId?: number
  brandId?: number
  q?: string
  sort?: ProductSort
  /** Receives the new raw value; an empty string clears the filter. */
  onChange: (name: FilterName, value: string) => void
}

// Native selects: they behave the same in browsers and in jsdom tests, and match ui/input.
const selectClass =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3'

export function ProductFilters({
  categories,
  brands,
  categoryId,
  brandId,
  q,
  sort,
  onChange,
}: ProductFiltersProps) {
  const sortOptions: { value: ProductSort; label: string }[] = [
    { value: 'newest', label: t('catalog.sort_newest') },
    { value: 'price_asc', label: t('catalog.sort_price_asc') },
    { value: 'price_desc', label: t('catalog.sort_price_desc') },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Keyed by the URL value so that the draft resets when the URL changes (e.g. browser back). */}
      <SearchForm key={q ?? ''} initialQuery={q ?? ''} onSubmit={(value) => onChange('q', value)} />
      <FormField label={t('catalog.filter_category')} htmlFor="filter-category">
        <select
          id="filter-category"
          className={selectClass}
          value={categoryId ?? ''}
          onChange={(event) => onChange('category_id', event.target.value)}
        >
          <option value="">{t('catalog.all_categories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('catalog.filter_brand')} htmlFor="filter-brand">
        <select
          id="filter-brand"
          className={selectClass}
          value={brandId ?? ''}
          onChange={(event) => onChange('brand_id', event.target.value)}
        >
          <option value="">{t('catalog.all_brands')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('catalog.filter_sort')} htmlFor="filter-sort">
        <select
          id="filter-sort"
          className={selectClass}
          value={sort ?? 'newest'}
          onChange={(event) => onChange('sort', event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
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
    <form role="search" onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] items-end gap-2">
      <FormField label={t('catalog.filter_search')} htmlFor="filter-q">
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
