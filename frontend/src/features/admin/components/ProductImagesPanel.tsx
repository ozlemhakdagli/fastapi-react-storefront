import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useDeleteProductImage,
  useReorderProductImages,
  useUploadProductImage,
} from '@/features/admin/hooks/useAdminProducts'
import { t } from '@/lib/i18n'
import type { ProductImage } from '@/lib/types'

// The formats that the server accepts (checked again by magic bytes on upload).
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

type ImageAction = 'upload' | 'reorder' | 'remove'

interface ProductImagesPanelProps {
  productId: number
  /** The images in display order, as the product detail returns them. */
  images: ProductImage[]
}

/** Uploads, reorders and deletes the images of one existing product. */
export function ProductImagesPanel({ productId, images }: ProductImagesPanelProps) {
  const upload = useUploadProductImage(productId)
  const reorder = useReorderProductImages(productId)
  const remove = useDeleteProductImage(productId)
  const [file, setFile] = useState<File | null>(null)
  // A new key replaces the file input, which clears the chosen file after a successful upload.
  const [inputKey, setInputKey] = useState(0)
  // Only the most recent action may show an error, so an old message does not stay up.
  const [lastAction, setLastAction] = useState<ImageAction | null>(null)
  const failures: Record<ImageAction, Error | null> = {
    upload: upload.error,
    reorder: reorder.error,
    remove: remove.error,
  }
  const error = lastAction === null ? null : failures[lastAction]

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    setLastAction('upload')
    upload.mutate(file, {
      onSuccess: () => {
        setFile(null)
        setInputKey((key) => key + 1)
      },
    })
  }

  /** Swaps the image at `index` with its neighbour; the server wants the full new order. */
  function move(index: number, direction: -1 | 1) {
    const ids = images.map((image) => image.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(index + direction, 0, moved)
    setLastAction('reorder')
    reorder.mutate(ids)
  }

  function deleteImage(imageId: number) {
    setLastAction('remove')
    remove.mutate(imageId)
  }

  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold">{t('adminproducts.images_title')}</h2>
      <ErrorNotice error={error} />
      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('adminproducts.images_empty')}</p>
      ) : (
        <ol className="grid gap-3">
          {images.map((image, index) => {
            const position = index + 1
            return (
              <li key={image.id} className="flex flex-wrap items-center gap-3">
                <img
                  src={image.url}
                  alt={t('adminproducts.image_alt', { position })}
                  className="size-16 rounded-md border object-cover"
                />
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === 0 || reorder.isPending}
                    aria-label={t('adminproducts.image_move_up_label', { position })}
                    onClick={() => move(index, -1)}
                  >
                    {t('adminproducts.image_move_up')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === images.length - 1 || reorder.isPending}
                    aria-label={t('adminproducts.image_move_down_label', { position })}
                    onClick={() => move(index, 1)}
                  >
                    {t('adminproducts.image_move_down')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={remove.isPending}
                    aria-label={t('adminproducts.image_delete_label', { position })}
                    onClick={() => deleteImage(image.id)}
                  >
                    {t('adminproducts.image_delete')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={handleUpload}>
        <FormField label={t('adminproducts.image_file')} htmlFor="product-image-file">
          <Input
            key={inputKey}
            id="product-image-file"
            type="file"
            accept={IMAGE_TYPES}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <Button type="submit" disabled={!file || upload.isPending}>
          {t('adminproducts.image_upload')}
        </Button>
      </form>
    </section>
  )
}
