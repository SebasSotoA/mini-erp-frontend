"use client"

import { X } from "lucide-react"
import type React from "react"
import { useEffect } from "react"

import { Button } from "./button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      <div className={`relative z-10 w-full rounded-lg bg-white shadow-xl ${
        size === "sm" ? "max-w-sm" :
        size === "md" ? "max-w-md" :
        size === "lg" ? "max-w-lg" :
        size === "xl" ? "max-w-4xl" :
        "max-w-lg"
      }`}>
        <div className="flex items-center justify-between border-b border-gray-200 p-6 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6 pt-0">{children}</div>
      </div>
    </div>
  )
}
