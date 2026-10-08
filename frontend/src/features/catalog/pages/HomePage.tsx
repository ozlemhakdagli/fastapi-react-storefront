import { Link } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { useProducts } from '@/features/catalog/hooks/useProducts'
import { useBrands, useCategories } from '@/features/catalog/hooks/useTaxonomy'
import { t } from '@/lib/i18n'

const NEW_PRODUCTS_COUNT = 8

export default function HomePage() {
  const newProducts = useProducts({ is_new: true, page_size: NEW_PRODUCTS_COUNT })
  const categories = useCategories()
  const brands = useBrands()

  return (
    <div className="grid gap-12">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t('catalog.home_new_products')}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/products">{t('catalog.home_all_products')}</Link>
          </Button>
        </div>
        <ErrorNotice error={newProducts.error} />
        {newProducts.isPending ? <p className="text-muted-foreground text-sm">{t('common.loading')}</p> : null}
        {newProducts.data && newProducts.data.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('catalog.home_no_new_products')}</p>
        ) : null}
        {newProducts.data && newProducts.data.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {newProducts.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">{t('catalog.home_categories')}</h2>
        <ErrorNotice error={categories.error} />
        <div className="flex flex-wrap gap-2">
          {categories.data?.map((category) => (
            <Button key={category.id} asChild variant="outline" size="sm">
              <Link to={`/products?category_id=${category.id}`}>{category.name}</Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">{t('catalog.home_brands')}</h2>
        <ErrorNotice error={brands.error} />
        <div className="flex flex-wrap gap-2">
          {brands.data?.map((brand) => (
            <Button key={brand.id} asChild variant="outline" size="sm">
              <Link to={`/products?brand_id=${brand.id}`}>{brand.name}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
