import { Link } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { categoryIcon } from '@/components/ProductImage'
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
      <section className="bg-linear-to-br from-primary to-primary/90 text-primary-foreground grid gap-4 rounded-2xl p-8 md:p-12">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          {t('catalog.hero_title')}
        </h1>
        <p className="max-w-xl text-base md:text-lg">{t('catalog.hero_subtitle')}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="focus-visible:ring-primary-foreground/70"
          >
            <Link to="/products">{t('catalog.hero_cta_products')}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-primary-foreground hover:text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground/70 bg-transparent"
          >
            <Link to="/contact">{t('catalog.hero_cta_contact')}</Link>
          </Button>
        </div>
      </section>

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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.data?.map((category) => {
            const Icon = categoryIcon(category.name)
            return (
              <Link
                key={category.id}
                to={`/products?category_id=${category.id}`}
                className="bg-card ring-foreground/10 motion-safe:hover:-translate-y-0.5 flex flex-col gap-3 rounded-xl p-4 ring-1 transition hover:shadow-md"
              >
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="font-medium wrap-break-word">{category.name}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">{t('catalog.home_brands')}</h2>
        <ErrorNotice error={brands.error} />
        <div className="flex flex-wrap gap-2">
          {brands.data?.map((brand) => (
            <Link
              key={brand.id}
              to={`/products?brand_id=${brand.id}`}
              className="bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-ring focus-visible:ring-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors outline-none"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
