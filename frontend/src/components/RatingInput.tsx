import { Star } from 'lucide-react'
import { type KeyboardEvent, useRef, useState } from 'react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const RATINGS = [1, 2, 3, 4, 5]
const STEPS: Partial<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

interface RatingInputProps {
  value: number | null
  onChange: (rating: number) => void
  disabled?: boolean
  label: string
}

// A radio group: the arrow keys move the choice and the focus (wrapping at the ends), hovering previews.
export function RatingInput({ value, onChange, disabled = false, label }: RatingInputProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const tabStop = value ?? 1
  const shown = preview ?? value ?? 0

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, rating: number) {
    const step = STEPS[event.key]
    if (step === undefined) return
    event.preventDefault()
    const next = ((rating - 1 + step + RATINGS.length) % RATINGS.length) + 1
    buttons.current[next - 1]?.focus()
    onChange(next)
  }

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1" onMouseLeave={() => setPreview(null)}>
      {RATINGS.map((rating) => (
        <button
          key={rating}
          ref={(element) => {
            buttons.current[rating - 1] = element
          }}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={t('catalog.rating_input_star', { count: rating })}
          tabIndex={rating === tabStop ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(rating)}
          onKeyDown={(event) => handleKeyDown(event, rating)}
          onMouseEnter={() => setPreview(rating)}
          className="cursor-pointer rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            aria-hidden="true"
            data-filled={rating <= shown}
            className={cn('size-6', rating <= shown ? 'fill-current text-warning' : 'text-muted-foreground/40')}
          />
        </button>
      ))}
    </div>
  )
}
