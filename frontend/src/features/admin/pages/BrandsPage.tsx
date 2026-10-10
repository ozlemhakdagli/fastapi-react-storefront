import { TaxonomyManager } from '@/features/admin/components/TaxonomyManager'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'

export default function BrandsPage() {
  useDocumentTitle(t('admintaxonomy.brands_title'))
  return <TaxonomyManager title={t('admintaxonomy.brands_title')} endpoint="/admin/brands" />
}
