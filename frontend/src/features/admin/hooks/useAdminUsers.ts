import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Page, User } from '@/lib/types'

// Every admin user query starts with ['admin', 'users'], so one invalidation refreshes them all.

const PAGE_SIZE = 20

export type UserRole = User['role']

export interface AdminUserFilters {
  role?: UserRole
  /** Matches the e-mail or the name. */
  q?: string
  page: number
}

/** POST /admin/users body. Empty optional fields are sent as null. */
export interface AdminUserCreateInput {
  email: string
  password: string
  full_name: string
  role: UserRole
  phone: string | null
  address: string | null
}

/** PATCH /admin/users/:id body. `password` is present only when a new one was typed. */
export interface AdminUserUpdateInput {
  full_name: string
  phone: string | null
  address: string | null
  role: UserRole
  is_active: boolean
  password?: string
}

/** One page of users, filtered by role and by a search text. */
export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', 'list', filters],
    queryFn: () =>
      api.get<Page<User>>('/admin/users', {
        role: filters.role,
        q: filters.q,
        page: filters.page,
        page_size: PAGE_SIZE,
      }),
  })
}

/** Creates a user. The server answers 409 `email_taken` when the e-mail is registered already. */
export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AdminUserCreateInput) => api.post<User>('/admin/users', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

/** Updates a user. The server answers 409 `last_admin` when the change would leave no active admin. */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminUserUpdateInput }) =>
      api.patch<User>(`/admin/users/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
