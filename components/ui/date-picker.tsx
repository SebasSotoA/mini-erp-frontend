"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showIcon?: boolean
  yearRangePast?: number // Años hacia atrás desde el actual (por defecto 20)
  yearRangeFuture?: number // Años hacia adelante desde el actual (por defecto 5)
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled = false,
  showIcon = true,
  yearRangePast = 20,
  yearRangeFuture = 5,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateChange = (date: Date | undefined) => {
    onChange?.(date || null)
    setOpen(false)
  }

  const displayValue = value && value instanceof Date ? value : undefined

  const currentYear = new Date().getFullYear()
  const fromYear = currentYear - yearRangePast
  const toYear = currentYear + yearRangeFuture

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50",
            !displayValue && "text-camouflage-green-500",
            className
          )}
          disabled={disabled}
        >
          {/* ✅ Ícono condicional */}
          {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
          {displayValue ? (
            format(displayValue, "dd/MM/yyyy", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-camouflage-green-200 z-50" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="bg-white rounded-md">
        <Calendar
          mode="single"
          selected={displayValue}
          onSelect={handleDateChange}
          initialFocus
          locale={es}
          className="bg-white"
          showOutsideDays
        />
          <div className="flex items-center justify-between gap-2 p-3 border-t border-camouflage-green-200">
            <Button
              type="button"
              variant="ghost"
              className="text-camouflage-green-700 hover:bg-camouflage-green-50"
              onClick={() => {
                onChange?.(null)
                setOpen(false)
              }}
            >
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800 border-camouflage-green-700"
                onClick={() => {
                  const today = new Date()
                  onChange?.(today)
                  setOpen(false)
                }}
              >
                Hoy
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}