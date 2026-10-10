import { TaxonomyManager } from '@/features/admin/components/TaxonomyManager'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'

export default function CategoriesPage() {
  useDocumentTitle(t('admintaxonomy.categories_title'))
  return <TaxonomyManager title={t('admintaxonomy.categories_title')} endpoint="/admin/categories" />
}
