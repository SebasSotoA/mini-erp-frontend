import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { InventoryProvider } from "@/contexts/inventory-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Inventory Management Dashboard",
  description: "A comprehensive inventory management system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InventoryProvider>{children}</InventoryProvider>
      </body>
    </html>
  )
}
