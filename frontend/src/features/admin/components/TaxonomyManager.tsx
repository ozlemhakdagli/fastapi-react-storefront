import { useState } from 'react'
import type { FormEvent } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  type TaxonomyEndpoint,
  useAdminTaxonomy,
  useDeleteTaxonomy,
  useSaveTaxonomy,
} from '@/features/admin/hooks/useAdminTaxonomy'
import { ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Taxonomy } from '@/lib/types'

interface TaxonomyManagerProps {
  title: string
  endpoint: TaxonomyEndpoint
}

// The open form: `item` is the row being edited, or null for a new row. null means closed.
type FormState = { item: Taxonomy | null } | null

/** Table of a category or brand list with create, edit and delete. */
export function TaxonomyManager({ title, endpoint }: TaxonomyManagerProps) {
  const list = useAdminTaxonomy(endpoint)
  const remove = useDeleteTaxonomy(endpoint)
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Taxonomy | null>(null)

  const columns: Column<Taxonomy>[] = [
    { key: 'name', header: t('admintaxonomy.name'), cell: (row) => row.name },
    {
      key: 'description',
      header: t('admintaxonomy.description'),
      cell: (row) => row.description,
      className: 'whitespace-normal',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setForm({ item: row })}>
            {t('common.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleting(row)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ]

  function confirmDelete() {
    if (deleting === null) return
    remove.mutate(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        actions={<Button onClick={() => setForm({ item: null })}>{t('admintaxonomy.create')}</Button>}
      />
      {/* A refused delete (has_dependencies) is shown here, because the dialog has already closed. */}
      <ErrorNotice error={remove.error} />
      {list.isError ? (
        <ErrorNotice error={list.error} />
      ) : (
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          rowKey={(row) => row.id}
          emptyText={list.isPending ? t('common.loading') : t('common.empty')}
        />
      )}
      {form ? (
        <TaxonomyFormDialog
          endpoint={endpoint}
          item={form.item}
          onClose={() => setForm(null)}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        title={t('admintaxonomy.delete_title')}
        description={
          deleting ? t('admintaxonomy.delete_description', { name: deleting.name }) : undefined
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

interface TaxonomyFormDialogProps {
  endpoint: TaxonomyEndpoint
  item: Taxonomy | null
  onClose: () => void
}

// Mounted only while open, so every opening starts with the row's values and no old error.
function TaxonomyFormDialog({ endpoint, item, onClose }: TaxonomyFormDialogProps) {
  const save = useSaveTaxonomy(endpoint)
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  // The empty-name message appears after the first submit attempt, then follows the input.
  const [attempted, setAttempted] = useState(false)

  const nameTaken = save.error instanceof ApiError && save.error.code === 'name_taken'
  const nameError = nameTaken
    ? errorMessage(save.error)
    : attempted && name.trim() === ''
      ? t('admintaxonomy.name_required')
      : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return // a second submit must not save a second row
    setAttempted(true)
    if (name.trim() === '') return
    save.mutate(
      { id: item?.id ?? null, input: { name: name.trim(), description: description.trim() } },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        {/* noValidate: the messages come from our own validation and from the API. */}
        <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {item ? t('admintaxonomy.edit_title') : t('admintaxonomy.create_title')}
            </DialogTitle>
          </DialogHeader>
          <FormField label={t('admintaxonomy.name')} htmlFor="taxonomy-name" error={nameError}>
            <Input
              id="taxonomy-name"
              maxLength={100}
              aria-invalid={nameError ? true : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label={t('admintaxonomy.description')} htmlFor="taxonomy-description">
            <Textarea
              id="taxonomy-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          {/* name_taken is shown on the name field above, so it is not repeated here. */}
          <ErrorNotice error={nameTaken ? null : save.error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
