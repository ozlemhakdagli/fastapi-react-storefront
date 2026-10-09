import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ApiError } from '@/lib/api'
import { ThemeProvider } from '@/lib/theme'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // One retry for network and server errors; a 4xx answer (for example an unknown product) will not change.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
