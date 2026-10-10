import { Link } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { useFavoriteProducts } from '@/features/favorites/hooks/useFavorites'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import { usePageParam } from '@/lib/usePageParam'

export default function FavoritesPage() {
  useDocumentTitle(t('favorites.title'))
  const [page, changePage] = usePageParam()
  const favorites = useFavoriteProducts(page)
  return (
    <div className="grid gap-6">
      <PageHeader title={t('favorites.title')} />
      <ErrorNotice error={favorites.error} />
      {favorites.isPending ? <LoadingNotice /> : null}
      {favorites.data && favorites.data.items.length === 0 ? (
        <div className="grid justify-items-start gap-3">
          <p className="text-muted-foreground text-sm">{t('favorites.empty')}</p>
          <Link to="/products" className="text-primary font-medium underline underline-offset-4">
            {t('favorites.browse_products')}
          </Link>
        </div>
      ) : null}
      {favorites.data && favorites.data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {favorites.data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
      {favorites.data ? (
        <Pagination
          page={page}
          pageSize={favorites.data.page_size}
          total={favorites.data.total}
          onChange={changePage}
        />
      ) : null}
    </div>
  )
}
