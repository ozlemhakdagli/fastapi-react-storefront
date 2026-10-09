import { FormField } from '@/components/FormField'
import { NativeSelect } from '@/components/NativeSelect'
import { SearchForm } from '@/components/SearchForm'
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
    <div className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1 lg:self-start">
      {/* Keyed by the URL value so that the draft resets when the URL changes (e.g. browser back). */}
      <SearchForm
        key={q ?? ''}
        id="filter-q"
        label={t('catalog.filter_search')}
        initialQuery={q ?? ''}
        onSubmit={(value) => onChange('q', value)}
      />
      <FormField label={t('catalog.filter_category')} htmlFor="filter-category">
        <NativeSelect
          id="filter-category"
          value={categoryId ?? ''}
          onChange={(event) => onChange('category_id', event.target.value)}
        >
          <option value="">{t('catalog.all_categories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label={t('catalog.filter_brand')} htmlFor="filter-brand">
        <NativeSelect
          id="filter-brand"
          value={brandId ?? ''}
          onChange={(event) => onChange('brand_id', event.target.value)}
        >
          <option value="">{t('catalog.all_brands')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label={t('catalog.filter_sort')} htmlFor="filter-sort">
        <NativeSelect
          id="filter-sort"
          value={sort ?? 'newest'}
          onChange={(event) => onChange('sort', event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FormField>
    </div>
  )
}
