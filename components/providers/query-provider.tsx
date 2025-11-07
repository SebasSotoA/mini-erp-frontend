"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import dynamic from "next/dynamic"

// Importación dinámica del Devtools solo en desarrollo
// Next.js eliminará este código del bundle en producción
const ReactQueryDevtools = dynamic(
  () =>
    process.env.NODE_ENV === "development"
      ? import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      : Promise.resolve({ default: () => null }),
  { ssr: false },
)

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos se consideran "frescos" (5 minutos)
            staleTime: 5 * 60 * 1000,
            // Tiempo que los datos se mantienen en caché (10 minutos)
            gcTime: 10 * 60 * 1000, // Antes era cacheTime, ahora es gcTime
            // Revalidar cuando la ventana recupera el foco
            refetchOnWindowFocus: true,
            // Reintentar 3 veces con backoff exponencial
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // No revalidar en remount si los datos están frescos
            refetchOnMount: true,
          },
          mutations: {
            // Reintentar 1 vez en mutations
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

