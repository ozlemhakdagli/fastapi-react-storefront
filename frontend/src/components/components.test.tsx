import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Money } from '@/components/Money'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import { ORDER_STATUSES } from '@/lib/types'

describe('Pagination', () => {
  it('calls onChange(page + 1) when Next is clicked', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} pageSize={10} total={50} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: t('common.next') }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('calls onChange(page - 1) when Previous is clicked', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} pageSize={10} total={50} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: t('common.previous') }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('disables Previous on the first page and Next on the last page', () => {
    const { rerender } = render(<Pagination page={1} pageSize={10} total={50} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: t('common.previous') })).toBeDisabled()
    rerender(<Pagination page={5} pageSize={10} total={50} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: t('common.next') })).toBeDisabled()
  })

  it('shows the page position', () => {
    render(<Pagination page={2} pageSize={10} total={50} onChange={vi.fn()} />)
    expect(screen.getByText(t('common.page_of', { page: 2, pages: 5 }))).toBeInTheDocument()
  })

  it('renders nothing when everything fits on one page', () => {
    const { container } = render(<Pagination page={1} pageSize={10} total={7} onChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('StatusBadge', () => {
  it.each(ORDER_STATUSES)('renders the label for status %s', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(t(`common.status_${status}`))).toBeInTheDocument()
    expect(t(`common.status_${status}`)).not.toBe(`common.status_${status}`)
  })
})

describe('DataTable', () => {
  interface Row {
    id: number
    name: string
  }
  const columns = [
    { key: 'id', header: 'ID', cell: (row: Row) => row.id },
    { key: 'name', header: 'Ad', cell: (row: Row) => row.name },
  ]

  it('shows emptyText when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyText="Hiç kayıt yok" />)
    expect(screen.getByText('Hiç kayıt yok')).toBeInTheDocument()
  })

  it('renders headers and one line per row', () => {
    render(
      <DataTable
        columns={columns}
        rows={[
          { id: 1, name: 'Klavye' },
          { id: 2, name: 'Fare' },
        ]}
        rowKey={(r) => r.id}
        emptyText="-"
      />,
    )
    expect(screen.getByText('Ad')).toBeInTheDocument()
    expect(screen.getByText('Klavye')).toBeInTheDocument()
    expect(screen.getByText('Fare')).toBeInTheDocument()
  })
})

describe('ErrorNotice', () => {
  it('shows the translated message of an ApiError as an alert', () => {
    render(<ErrorNotice error={new ApiError(409, 'email_taken')} />)
    expect(screen.getByRole('alert')).toHaveTextContent(t('errors.email_taken'))
  })

  it('renders nothing without an error', () => {
    const { container } = render(<ErrorNotice error={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Money', () => {
  it('renders the formatted amount', () => {
    render(<Money value="1299.90" />)
    expect(screen.getByText(/1\.299,90/)).toBeInTheDocument()
  })
})

describe('FormField', () => {
  it('links the label to the control and shows the error text', () => {
    render(
      <FormField label="E-posta" htmlFor="email" error="Geçersiz e-posta">
        <Input id="email" />
      </FormField>,
    )
    expect(screen.getByLabelText('E-posta')).toBeInTheDocument()
    expect(screen.getByText('Geçersiz e-posta')).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('calls onConfirm and onCancel from its buttons', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Silinsin mi?"
        confirmLabel="Evet, sil"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(screen.getByText('Silinsin mi?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Evet, sil' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: t('common.cancel') }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when closed', () => {
    render(<ConfirmDialog open={false} title="Silinsin mi?" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByText('Silinsin mi?')).not.toBeInTheDocument()
  })
})
