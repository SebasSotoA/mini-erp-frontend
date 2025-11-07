import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"

import "./globals.css"
import { InventoryProvider } from "@/contexts/inventory-context"
import { ExtraFieldsProvider } from "@/contexts/extra-fields-context"
import { QueryProvider } from "@/components/providers/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Inventa",
  description: "Sistema de gestión de inventario",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <InventoryProvider>
            <ExtraFieldsProvider>{children}</ExtraFieldsProvider>
          </InventoryProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
