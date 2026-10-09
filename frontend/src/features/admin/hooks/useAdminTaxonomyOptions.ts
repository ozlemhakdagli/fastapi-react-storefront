import { useAdminTaxonomy } from '@/features/admin/hooks/useAdminTaxonomy'

/** All categories and brands for the product form and the product filters. */
export function useAdminTaxonomyOptions() {
  return {
    categories: useAdminTaxonomy('/admin/categories'),
    brands: useAdminTaxonomy('/admin/brands'),
  }
}
