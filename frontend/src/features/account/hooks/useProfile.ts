import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { api, tokenStore } from '@/lib/api'
import type { TokenOut, User } from '@/lib/types'

interface ProfileInput {
  full_name: string
  phone: string | null
  address: string | null
}

interface PasswordInput {
  current_password: string
  new_password: string
}

/** PATCH /auth/me with the editable fields only. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: ProfileInput) => api.patch<User>('/auth/me', input),
  })
}

/**
 * POST /auth/change-password. The answer is a token for the new password: it replaces the stored
 * one, so this browser stays signed in while the other sessions of the account end.
 */
export function useChangePassword() {
  const { refresh } = useAuth()
  return useMutation({
    mutationFn: (input: PasswordInput) => api.post<TokenOut>('/auth/change-password', input),
    onSuccess: async (result) => {
      tokenStore.set(result.access_token)
      await refresh()
    },
  })
}
