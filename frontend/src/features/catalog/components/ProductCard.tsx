import { Link } from 'react-router'
import { Money } from '@/components/Money'
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
      className="bg-card ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1 transition-shadow hover:shadow-md"
    >
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        className="bg-muted aspect-square w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.is_new ? <Badge className="w-fit">{t('catalog.card_new')}</Badge> : null}
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">{product.short_description}</p>
        <Money value={product.price} className="mt-auto pt-1 font-semibold" />
      </div>
    </Link>
  )
}
