"use client"

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from "lucide-react"
import * as React from "react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarView = "calendar" | "month" | "year"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()
  const [currentView, setCurrentView] = React.useState<CalendarView>("calendar")
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date())
  const yearsContainerRef = React.useRef<HTMLDivElement>(null)

  // Nombres de meses en español
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Generar años (rango de 10 años antes y después del año del mes seleccionado)
  const selectedYear = currentMonth.getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i)

  // Generar meses para la vista de meses
  const months = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    name: monthNames[i],
  }))

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(monthIndex)
    setCurrentMonth(newDate)
    setCurrentView("calendar")
  }

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(year)
    setCurrentMonth(newDate)
    setCurrentView("calendar")
  }

  // Efecto para hacer scroll al año seleccionado cuando se abre la vista de años
  React.useEffect(() => {
    if (currentView === "year" && yearsContainerRef.current) {
      const selectedYearButton = yearsContainerRef.current.querySelector(`[data-year="${selectedYear}"]`) as HTMLElement
      if (selectedYearButton) {
        selectedYearButton.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentView, selectedYear])

  // Componente personalizado para el encabezado
  const CustomCaption = () => {
    if (currentView === "month") {
      return (
        <div className="flex w-full flex-col gap-2">
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("calendar")}
              className="mx-4 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <span className="absolute left-1/2 -translate-x-1/2 transform text-sm font-semibold text-camouflage-green-700">
              Seleccionar Mes
            </span>
          </div>
          <div className="grid w-full grid-cols-3 gap-1 p-0">
            {months.map((month) => (
              <Button
                key={month.index}
                variant="ghost"
                size="sm"
                onClick={() => handleMonthSelect(month.index)}
                className={cn(
                  "flex h-8 w-full items-center justify-center text-sm text-camouflage-green-700 hover:bg-camouflage-green-50",
                  month.index === currentMonth.getMonth() && "bg-camouflage-green-100 font-semibold",
                )}
              >
                {month.name}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    if (currentView === "year") {
      return (
        <div className="flex w-full flex-col gap-2">
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("calendar")}
              className="mx-4 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <span className="absolute left-1/2 -translate-x-1/2 transform text-sm font-semibold text-camouflage-green-700">
              Seleccionar Año
            </span>
          </div>
          <div ref={yearsContainerRef} className="grid max-h-48 w-full grid-cols-4 gap-2 overflow-y-auto p-2">
            {years.map((year) => (
              <Button
                key={year}
                variant="ghost"
                size="sm"
                onClick={() => handleYearSelect(year)}
                data-year={year}
                className={cn(
                  "flex h-8 w-full items-center justify-center text-sm text-camouflage-green-700 hover:bg-camouflage-green-50",
                  year === currentMonth.getFullYear() && "bg-camouflage-green-100 font-semibold",
                )}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    // Vista del calendario normal
    return (
      <div className="flex w-full items-center justify-between">
        {/* Botón anterior */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newDate = new Date(currentMonth)
            newDate.setMonth(newDate.getMonth() - 1)
            setCurrentMonth(newDate)
          }}
          className="p-2 text-camouflage-green-700 hover:bg-camouflage-green-50"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        {/* Botones de mes y año */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("month")}
            className="flex items-center gap-1 font-medium text-camouflage-green-700 hover:bg-camouflage-green-50"
          >
            {monthNames[currentMonth.getMonth()]}
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("year")}
            className="flex items-center gap-1 font-medium text-camouflage-green-700 hover:bg-camouflage-green-50"
          >
            {currentMonth.getFullYear()}
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
        </div>

        {/* Botón siguiente */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newDate = new Date(currentMonth)
            newDate.setMonth(newDate.getMonth() + 1)
            setCurrentMonth(newDate)
          }}
          className="p-2 text-camouflage-green-700 hover:bg-camouflage-green-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="px-4 py-1">
        <CustomCaption />
      </div>
      {currentView === "calendar" && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn(
            "group/calendar bg-background px-3 py-0 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
            String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
            String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
            className,
          )}
          captionLayout="label"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          formatters={{
            formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
            formatWeekdayName: (date) => {
              const WEEKDAYS_ES = ["DO", "LU", "MA", "MI", "JU", "VI", "SÁ"]
              return WEEKDAYS_ES[date.getDay()]
            },
            ...formatters,
          }}
          classNames={{
            root: cn("w-full", defaultClassNames.root),
            months: cn("flex gap-4 flex-col mb-2 md:flex-row relative", defaultClassNames.months),
            month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
            nav: cn(
              "hidden", // Oculta la navegación nativa ya que usamos la personalizada
              defaultClassNames.nav,
            ),
            button_previous: cn(
              "hidden", // Oculta el botón anterior nativo
              defaultClassNames.button_previous,
            ),
            button_next: cn(
              "hidden", // Oculta el botón siguiente nativo
              defaultClassNames.button_next,
            ),
            month_caption: cn(
              "hidden", // Oculta el caption nativo
              defaultClassNames.month_caption,
            ),
            dropdowns: cn(
              "hidden", // Oculta los dropdowns nativos
              defaultClassNames.dropdowns,
            ),
            dropdown_root: cn(
              "hidden", // Oculta el dropdown root nativo
              defaultClassNames.dropdown_root,
            ),
            dropdown: cn(
              "hidden", // Oculta el dropdown nativo
              defaultClassNames.dropdown,
            ),
            caption_label: cn(
              "select-none font-medium",
              captionLayout === "label"
                ? "text-sm"
                : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
              defaultClassNames.caption_label,
            ),
            table: "w-full border-collapse",
            weekdays: cn("flex", defaultClassNames.weekdays),
            weekday: cn(
              "text-camouflage-green-700 rounded-md flex-1 font-normal text-[0.8rem] select-none text-center py-2",
              defaultClassNames.weekday,
            ),
            week: cn("flex w-full mt-2", defaultClassNames.week),
            week_number_header: cn("select-none w-[--cell-size]", defaultClassNames.week_number_header),
            week_number: cn("text-[0.8rem] select-none text-muted-foreground", defaultClassNames.week_number),
            day: cn(
              "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
              defaultClassNames.day,
            ),
            range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
            range_middle: cn("rounded-none", defaultClassNames.range_middle),
            range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
            today: cn(
              "bg-camouflage-green-200 text-camouflage-green-800 font-medium rounded-md data-[selected=true]:bg-camouflage-green-700 data-[selected=true]:text-white data-[selected=true]:rounded-md",
              defaultClassNames.today,
            ),
            outside: cn(
              "text-camouflage-green-400 opacity-60 aria-selected:text-camouflage-green-400",
              defaultClassNames.outside,
            ),
            disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
            hidden: cn("invisible", defaultClassNames.hidden),
            ...classNames,
          }}
          components={{
            Chevron: ({ className, orientation, ...props }) => {
              if (orientation === "left") {
                return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
              }

              if (orientation === "right") {
                return <ChevronRightIcon className={cn("size-4", className)} {...props} />
              }

              return <ChevronDownIcon className={cn("size-4", className)} {...props} />
            },
            DayButton: CalendarDayButton,
            WeekNumber: ({ children, ...props }) => {
              return (
                <td {...props}>
                  <div className="flex size-[--cell-size] items-center justify-center text-center">{children}</div>
                </td>
              )
            },
            ...components,
          }}
          {...props}
        />
      )}
    </div>
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none text-camouflage-green-700 transition-colors duration-150 hover:bg-camouflage-green-100 hover:text-camouflage-green-900 focus-visible:outline-none focus-visible:ring-camouflage-green-500 data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-start=true]:rounded-l-md data-[range-end=true]:bg-camouflage-green-700 data-[range-middle=true]:bg-camouflage-green-100 data-[range-start=true]:bg-camouflage-green-700 data-[selected-single=true]:bg-camouflage-green-700 data-[selected-single=true]:font-semibold data-[range-end=true]:text-white data-[range-middle=true]:text-camouflage-green-900 data-[range-start=true]:text-white data-[selected-single=true]:text-white group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-camouflage-green-500 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-camouflage-green-500/50 [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
