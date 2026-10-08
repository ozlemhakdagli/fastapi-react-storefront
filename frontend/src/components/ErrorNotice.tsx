import { errorMessage } from '@/lib/i18n'

/** Shows the translated message of an error (typically `mutation.error` or `query.error`). */
export function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
    >
      {errorMessage(error)}
    </div>
  )
}
