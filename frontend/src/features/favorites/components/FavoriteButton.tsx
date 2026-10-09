import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/useFavorites'
import { t } from '@/lib/i18n'

interface FavoriteButtonProps {
  productId: number
  /** The product name, used in the accessible name of the button. */
  name: string
  className?: string
}

/** A heart that adds the product to the favourites. Anonymous visitors go to the login page. */
export function FavoriteButton({ productId, name, className }: FavoriteButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isFavorite = useIsFavorite(productId)
  const toggle = useToggleFavorite()

  function handleClick() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    toggle.mutate({ productId, favorite: !isFavorite })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t('favorites.remove', { name }) : t('favorites.add', { name })}
      disabled={toggle.isPending}
      onClick={handleClick}
      className={className}
    >
      <Heart aria-hidden="true" className={cn(isFavorite && 'fill-current text-destructive')} />
    </Button>
  )
}
