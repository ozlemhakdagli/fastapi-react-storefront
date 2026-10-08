import { TaxonomyManager } from '@/features/admin/components/TaxonomyManager'
import { t } from '@/lib/i18n'

export default function BrandsPage() {
  return <TaxonomyManager title={t('admintaxonomy.brands_title')} endpoint="/admin/brands" />
}
