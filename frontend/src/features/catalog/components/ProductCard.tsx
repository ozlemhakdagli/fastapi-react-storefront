import { Link } from 'react-router'
import { ProductImage } from '@/components/ProductImage'
import { Money } from '@/components/Money'
import { RatingStars } from '@/components/RatingStars'
import { StockBadge } from '@/components/StockBadge'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { t } from '@/lib/i18n'
import type { ProductListItem } from '@/lib/types'

interface ProductCardProps {
  product: ProductListItem
}

// The heart is a sibling of the link, not a child: a button inside a link is invalid HTML.
export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-card ring-foreground/10 motion-safe:hover:-translate-y-0.5 relative flex flex-col overflow-hidden rounded-xl ring-1 transition hover:shadow-md">
      <Link to={`/products/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative">
          <ProductImage
            name={product.name}
            imageUrl={product.image_url}
            category={product.category}
            className="aspect-square w-full"
          />
          {product.is_new ? (
            <Badge variant="warning" className="absolute top-2 left-2">
              {t('catalog.card_new')}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          {product.brand ? (
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {product.brand.name}
            </p>
          ) : null}
          <h3 className="line-clamp-2 font-medium wrap-break-word">{product.name}</h3>
          {product.rating_count > 0 ? (
            <RatingStars value={product.rating_avg} count={product.rating_count} className="text-xs" />
          ) : null}
          <p className="text-muted-foreground line-clamp-2 text-sm">{product.short_description}</p>
          <div className="mt-auto grid justify-items-start gap-2 pt-1">
            <Money value={product.price} className="text-primary font-semibold" />
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </Link>
      <FavoriteButton
        productId={product.id}
        name={product.name}
        className="absolute top-2 right-2 rounded-full bg-background/80"
      />
    </div>
  )
}
