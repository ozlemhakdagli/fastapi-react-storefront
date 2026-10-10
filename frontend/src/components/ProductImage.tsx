import { Cable, HardDrive, MemoryStick, Package, Usb, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Named } from '@/lib/types'

// Written out in full: Tailwind only generates classes whose complete names appear in the source.
const TONES = [
  'from-indigo-100 to-indigo-200 text-indigo-600',
  'from-violet-100 to-violet-200 text-violet-600',
  'from-sky-100 to-sky-200 text-sky-600',
  'from-emerald-100 to-emerald-200 text-emerald-600',
  'from-amber-100 to-amber-200 text-amber-600',
  'from-rose-100 to-rose-200 text-rose-600',
]

// Matches Turkish and English words in the category name. The order matters: an SSD or USB name
// also contains "drive". Lower-casing uses Turkish rules, so that a capital "İ" still becomes "i"
// and matches the keys.
export function categoryIcon(categoryName?: string | null): LucideIcon {
  const name = (categoryName ?? '').toLocaleLowerCase('tr')
  if (name.includes('ssd')) return Zap
  if (name.includes('usb')) return Usb
  if (name.includes('kart') || name.includes('card')) return MemoryStick
  if (name.includes('disk') || name.includes('drive')) return HardDrive
  if (name.includes('aksesuar') || name.includes('accessor')) return Cable
  return Package
}

interface ProductImageProps {
  name: string
  imageUrl: string
  category?: Named | null
  className?: string
  priority?: boolean
}

// A coloured icon tile while the product has no real photo, otherwise the photo.
export function ProductImage({
  name,
  imageUrl,
  category,
  className,
  priority = false,
}: ProductImageProps) {
  if (imageUrl.endsWith('/placeholder.svg')) {
    const Icon = categoryIcon(category?.name)
    const tone = TONES[(category?.id ?? 0) % TONES.length]
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(
          'flex items-center justify-center overflow-hidden bg-linear-to-br',
          tone,
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-1/3" strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={cn('object-cover', className)}
    />
  )
}

