import { useState } from 'react'
import type { FormEvent } from 'react'
import { LoadingNotice } from '@/components/LoadingNotice'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { NativeSelect } from '@/components/NativeSelect'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
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
  type AdminUserCreateInput,
  type AdminUserUpdateInput,
  type UserRole,
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
} from '@/features/admin/hooks/useAdminUsers'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { User } from '@/lib/types'

// Native selects: they behave the same in browsers and in jsdom tests, and match ui/input.
export default function UsersPage() {
  const [role, setRole] = useState<'' | UserRole>('')
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const users = useAdminUsers({ role: role || undefined, q: search || undefined, page })

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(draft.trim())
    setPage(1)
  }

  const columns: Column<User>[] = [
    { key: 'name', header: t('adminusers.column_name'), cell: (user) => user.full_name },
    { key: 'email', header: t('adminusers.column_email'), cell: (user) => user.email },
    { key: 'phone', header: t('adminusers.column_phone'), cell: (user) => user.phone ?? '' },
    { key: 'role', header: t('adminusers.column_role'), cell: (user) => roleLabel(user.role) },
    {
      key: 'active',
      header: t('adminusers.column_active'),
      cell: (user) => (
        <Badge variant={user.is_active ? 'secondary' : 'outline'}>
          {user.is_active ? t('adminusers.active') : t('adminusers.inactive')}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: t('adminusers.column_created'),
      cell: (user) => <time dateTime={user.created_at}>{formatDate(user.created_at)}</time>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (user) => (
        <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
          {t('common.edit')}
        </Button>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t('adminusers.title')}
        actions={<Button onClick={() => setCreating(true)}>{t('adminusers.new_user')}</Button>}
      />
      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[12rem_1fr]">
        <FormField label={t('adminusers.filter_role')} htmlFor="users-filter-role">
          <NativeSelect
            id="users-filter-role"
            value={role}
            onChange={(event) => {
              setRole(filterRole(event.target.value))
              setPage(1)
            }}
          >
            <option value="">{t('adminusers.role_all')}</option>
            <option value="customer">{t('adminusers.role_customer')}</option>
            <option value="admin">{t('adminusers.role_admin')}</option>
          </NativeSelect>
        </FormField>
        <form role="search" onSubmit={applySearch} className="grid grid-cols-[1fr_auto] items-end gap-2">
          <FormField label={t('adminusers.filter_search')} htmlFor="users-filter-search">
            <Input
              id="users-filter-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </FormField>
          <Button type="submit">{t('common.search')}</Button>
        </form>
      </div>

      <ErrorNotice error={users.error} />
      {users.isPending ? (
        <LoadingNotice />
      ) : null}
      {users.data ? (
        <>
          <DataTable
            columns={columns}
            rows={users.data.items}
            rowKey={(user) => user.id}
            emptyText={t('adminusers.empty')}
          />
          <Pagination
            page={page}
            pageSize={users.data.page_size}
            total={users.data.total}
            onChange={setPage}
          />
        </>
      ) : null}

      {creating ? <CreateUserDialog onClose={() => setCreating(false)} /> : null}
      {editing ? <EditUserDialog user={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{t('adminusers.create_title')}</DialogTitle>
        </DialogHeader>
        <CreateUserForm onDone={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const createUser = useCreateAdminUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  // Field errors appear after the first submit attempt, then follow the inputs.
  const [attempted, setAttempted] = useState(false)

  const emailError = email.trim() === '' ? t('adminusers.required') : undefined
  const fullNameError = fullName.trim() === '' ? t('adminusers.required') : undefined
  const passwordError = validatePassword(password, true)
  const invalid = Boolean(emailError || fullNameError || passwordError)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createUser.isPending) return // a second submit must not create a second user
    setAttempted(true)
    if (invalid) return
    const input: AdminUserCreateInput = {
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      role,
      phone: phone.trim() || null,
      address: address.trim() || null,
    }
    createUser.mutate(input, { onSuccess: () => onDone() })
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <FormField
        label={t('adminusers.field_email')}
        htmlFor="user-create-email"
        error={attempted ? emailError : undefined}
      >
        <Input
          id="user-create-email"
          type="email"
          autoComplete="off"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField
        label={t('adminusers.field_password')}
        htmlFor="user-create-password"
        error={attempted ? passwordError : undefined}
      >
        <Input
          id="user-create-password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t('adminusers.password_hint')}</p>
      </FormField>
      <FormField
        label={t('adminusers.field_full_name')}
        htmlFor="user-create-full-name"
        error={attempted ? fullNameError : undefined}
      >
        <Input
          id="user-create-full-name"
          autoComplete="off"
          maxLength={100}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminusers.field_role')} htmlFor="user-create-role">
        <NativeSelect
          id="user-create-role"
          value={role}
          onChange={(event) => setRole(formRole(event.target.value))}
        >
          <option value="customer">{t('adminusers.role_customer')}</option>
          <option value="admin">{t('adminusers.role_admin')}</option>
        </NativeSelect>
      </FormField>
      <FormField label={t('adminusers.field_phone')} htmlFor="user-create-phone">
        <Input
          id="user-create-phone"
          type="tel"
          autoComplete="off"
          maxLength={30}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminusers.field_address')} htmlFor="user-create-address">
        <Textarea
          id="user-create-address"
          rows={2}
          maxLength={500}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </FormField>
      <ErrorNotice error={createUser.error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={createUser.isPending}>
          {t('common.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{t('adminusers.edit_title')}</DialogTitle>
        </DialogHeader>
        <EditUserForm user={user} onDone={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function EditUserForm({ user, onDone }: { user: User; onDone: () => void }) {
  const updateUser = useUpdateAdminUser()
  const [fullName, setFullName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [address, setAddress] = useState(user.address ?? '')
  const [role, setRole] = useState<UserRole>(user.role)
  const [active, setActive] = useState(user.is_active)
  const [password, setPassword] = useState('')
  const [attempted, setAttempted] = useState(false)

  const fullNameError = fullName.trim() === '' ? t('adminusers.required') : undefined
  const passwordError = validatePassword(password, false)
  const invalid = Boolean(fullNameError || passwordError)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (updateUser.isPending) return
    setAttempted(true)
    if (invalid) return
    const input: AdminUserUpdateInput = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      role,
      is_active: active,
    }
    // An empty password field keeps the current password. The server rejects an explicit null
    // for password, so the key is left out instead.
    if (password !== '') input.password = password
    updateUser.mutate({ id: user.id, input }, { onSuccess: () => onDone() })
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <FormField label={t('adminusers.field_email')} htmlFor="user-edit-email">
        <Input id="user-edit-email" type="email" value={user.email} readOnly />
      </FormField>
      <FormField
        label={t('adminusers.field_full_name')}
        htmlFor="user-edit-full-name"
        error={attempted ? fullNameError : undefined}
      >
        <Input
          id="user-edit-full-name"
          autoComplete="off"
          maxLength={100}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminusers.field_phone')} htmlFor="user-edit-phone">
        <Input
          id="user-edit-phone"
          type="tel"
          autoComplete="off"
          maxLength={30}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminusers.field_address')} htmlFor="user-edit-address">
        <Textarea
          id="user-edit-address"
          rows={2}
          maxLength={500}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminusers.field_role')} htmlFor="user-edit-role">
        <NativeSelect
          id="user-edit-role"
          value={role}
          onChange={(event) => setRole(formRole(event.target.value))}
        >
          <option value="customer">{t('adminusers.role_customer')}</option>
          <option value="admin">{t('adminusers.role_admin')}</option>
        </NativeSelect>
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        {t('adminusers.field_active')}
      </label>
      <FormField
        label={t('adminusers.field_password_new')}
        htmlFor="user-edit-password"
        error={attempted ? passwordError : undefined}
      >
        <Input
          id="user-edit-password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t('adminusers.password_keep_hint')}</p>
      </FormField>
      <ErrorNotice error={updateUser.error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={updateUser.isPending}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** The server accepts 8 to 128 characters. An empty value is an error only when it is required. */
function validatePassword(value: string, required: boolean): string | undefined {
  if (value === '') return required ? t('adminusers.required') : undefined
  return value.length < 8 ? t('adminusers.password_too_short') : undefined
}

function roleLabel(role: UserRole): string {
  return role === 'admin' ? t('adminusers.role_admin') : t('adminusers.role_customer')
}

function filterRole(value: string): '' | UserRole {
  return value === 'customer' || value === 'admin' ? value : ''
}

function formRole(value: string): UserRole {
  return value === 'admin' ? 'admin' : 'customer'
}
