import * as React from "react"

import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost"
  size?: "sm" | "md" | "md2" | "lg" | "icon"
}

export const buttonVariants = (variant: ButtonProps["variant"] = "primary", size: ButtonProps["size"] = "md") => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-camouflage-green-700 text-white hover:bg-camouflage-green-800 focus:ring-camouflage-green-500",
    secondary: "bg-camouflage-green-100 text-camouflage-green-900 hover:bg-camouflage-green-200 focus:ring-camouflage-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "border border-camouflage-green-300 bg-white text-camouflage-green-700 hover:bg-camouflage-green-50 focus:ring-camouflage-green-500",
    ghost: "text-camouflage-green-700 hover:bg-camouflage-green-100 focus:ring-camouflage-green-500",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    md2: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-10 w-10",
  }

  return cn(baseClasses, variants[variant], sizes[size])
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants(variant, size), className)} {...props}>
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"
