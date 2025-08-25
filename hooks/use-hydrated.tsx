"use client"

import { useEffect, useState } from "react"

/**
 * Hook personalizado para evitar errores de hidratación
 * Retorna false durante SSR y true después de la hidratación
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

/**
 * Hook para obtener la fecha actual de manera segura para SSR
 * Retorna null durante SSR y la fecha actual después de la hidratación
 */
export function useCurrentTime(options?: Intl.DateTimeFormatOptions) {
  const [currentTime, setCurrentTime] = useState<string | null>(null)
  const hydrated = useHydrated()

  useEffect(() => {
    if (hydrated) {
      setCurrentTime(new Date().toLocaleString("es-ES", options))
    }
  }, [hydrated, options])

  return currentTime
}
