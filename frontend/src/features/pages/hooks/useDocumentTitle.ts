import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { siteQuery } from '@/features/pages/hooks/useSite'

/**
 * The browser tab shows "<page> | <shop name>". A page without a title shows the shop name alone.
 *
 * Every page sets its own title through this hook; no layout writes document.title, because the
 * effect of a layout runs after the effect of its page and would overwrite it. The shop name
 * comes from the site settings that the layout has loaded (useSite): this query only reads them,
 * so a page sends no request of its own.
 */
export function useDocumentTitle(title?: string | null): void {
  const shopName = useQuery({ ...siteQuery, enabled: false }).data?.site_name
  useEffect(() => {
    const parts = [title, shopName].filter(Boolean)
    if (parts.length > 0) document.title = parts.join(' | ')
  }, [title, shopName])
}
