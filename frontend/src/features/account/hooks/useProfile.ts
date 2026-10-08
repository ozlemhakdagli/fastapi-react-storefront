import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'

export interface ProfileInput {
  full_name: string
  phone: string
  address: string
}

export interface PasswordInput {
  current_password: string
  new_password: string
}

/** PATCH /auth/me with the editable fields only. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: ProfileInput) => api.patch<User>('/auth/me', input),
  })
}

/** POST /auth/change-password. The endpoint answers 204, so the result is undefined. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordInput) => api.post<void>('/auth/change-password', input),
  })
}
