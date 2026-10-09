/** A positive integer from the URL, or undefined (no filter) for anything else. */
export function parseId(value: string | null): number | undefined {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : undefined
}
