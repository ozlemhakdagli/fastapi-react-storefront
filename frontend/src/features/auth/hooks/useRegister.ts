import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'

export interface RegisterInput {
  email: string
  password: string
  full_name: string
  phone?: string
  address?: string
}

/** POST /auth/register. The endpoint returns no token, so the caller logs in afterwards. */
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<User>('/auth/register', input),
  })
}
