import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/i18n'

interface SearchFormProps {
  id: string
  label: string
  initialQuery: string
  onSubmit: (value: string) => void
}

/** Search input with a submit button for filtering list views. */
export function SearchForm({ id, label, initialQuery, onSubmit }: SearchFormProps) {
  const [draft, setDraft] = useState(initialQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(draft.trim())
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] items-end gap-2">
      <FormField label={label} htmlFor={id}>
        <Input
          id={id}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </FormField>
      <Button type="submit">{t('common.search')}</Button>
    </form>
  )
}
