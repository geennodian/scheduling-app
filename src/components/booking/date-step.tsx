"use client"

import * as React from "react"
import { ja } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { type Slot } from "./types"

interface DateStepProps {
  slots: Slot[]
  onSelectDate: (date: string) => void
}

export function DateStep({ slots, onSelectDate }: DateStepProps) {
  const [month, setMonth] = React.useState<Date>(() => new Date())

  // Build a set of available date strings (YYYY-MM-DD)
  const availableDates = React.useMemo(() => {
    return new Set(slots.map((s) => s.date))
  }, [slots])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function handleDayClick(date: Date | undefined) {
    if (!date) return
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    if (availableDates.has(dateStr)) {
      onSelectDate(dateStr)
    }
  }

  function isAvailable(date: Date): boolean {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return availableDates.has(`${yyyy}-${mm}-${dd}`)
  }

  if (availableDates.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 mb-3 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">現在予約可能な空き枠がありません</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        ご希望の日付を選択してください
      </p>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        locale={ja}
        disabled={(date) => date < today || !isAvailable(date)}
        modifiers={{ available: (date) => isAvailable(date) && date >= today }}
        modifiersClassNames={{
          available:
            "!bg-primary/10 !text-primary font-semibold hover:!bg-primary/20 cursor-pointer rounded-(--cell-radius)",
        }}
        onDayClick={handleDayClick}
        className="rounded-xl border shadow-sm"
        classNames={{
          month_caption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
        }}
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block w-3 h-3 rounded-sm bg-primary/10 border border-primary/30" />
        <span>予約可能な日</span>
      </div>
    </div>
  )
}
