"use client"

import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronDown, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder = "Seleccionar...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter((item) => item !== value))
    } else {
      onSelectedChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectedChange(selected.filter((item) => item !== value))
  }

  const selectedLabels = selected.map((value) => options.find((opt) => opt.value === value)?.label || value)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between border-camouflage-green-300 bg-white text-left font-normal text-camouflage-green-900 hover:bg-camouflage-green-50 focus:border-camouflage-green-500",
            !selected.length && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <span className="flex-1 truncate text-left">
            {selected.length === 0 ? (
              <span className="text-camouflage-green-500">{placeholder}</span>
            ) : (
              <span className="text-camouflage-green-900">
                {selected.length === 1 ? selectedLabels[0] : `${selected.length} seleccionados`}
              </span>
            )}
          </span>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", open && "rotate-180")} />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-camouflage-green-200 bg-white p-1 text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          )}
          align="start"
          sideOffset={4}
        >
          <div className="max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-camouflage-green-500">No hay opciones disponibles</div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-camouflage-green-50 focus:bg-camouflage-green-50"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="mr-2"
                      onCheckedChange={() => handleSelect(option.value)}
                    />
                    <span className="text-camouflage-green-900">{option.label}</span>
                    {isSelected && <Check className="ml-auto h-4 w-4 text-camouflage-green-600" />}
                  </div>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

