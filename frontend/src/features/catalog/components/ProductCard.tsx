import { Link } from 'react-router'
import { ProductImage } from '@/components/ProductImage'
import { Money } from '@/components/Money'
import { StockBadge } from '@/components/StockBadge'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'
import type { ProductListItem } from '@/lib/types'

interface ProductCardProps {
  product: ProductListItem
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-card ring-foreground/10 motion-safe:hover:-translate-y-0.5 flex flex-col overflow-hidden rounded-xl ring-1 transition hover:shadow-md"
    >
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
        <p className="text-muted-foreground line-clamp-2 text-sm">{product.short_description}</p>
        <div className="mt-auto grid justify-items-start gap-2 pt-1">
          <Money value={product.price} className="text-primary font-semibold" />
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  )
}
