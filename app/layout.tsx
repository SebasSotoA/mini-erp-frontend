import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"

import "./globals.css"
import { InventoryProvider } from "@/contexts/inventory-context"
import { ExtraFieldsProvider } from "@/contexts/extra-fields-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Inventory Management Dashboard",
  description: "A comprehensive inventory management system",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/placeholder-logo.svg",
        type: "image/svg+xml",
      },
      {
        url: "/placeholder-logo.png",
        type: "image/png",
      },
    ],
    shortcut: "/placeholder-logo.png",
    apple: "/placeholder-logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InventoryProvider>
          <ExtraFieldsProvider>{children}</ExtraFieldsProvider>
        </InventoryProvider>
      </body>
    </html>
  )
}
