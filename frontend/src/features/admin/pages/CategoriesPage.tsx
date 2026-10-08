import { TaxonomyManager } from '@/features/admin/components/TaxonomyManager'
import { t } from '@/lib/i18n'

export default function CategoriesPage() {
  return <TaxonomyManager title={t('admintaxonomy.categories_title')} endpoint="/admin/categories" />
}
