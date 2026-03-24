"use client"

import { Button } from "@/components/ui/button"
import { type Slot } from "./types"
import { cn } from "@/lib/utils"

interface TimeStepProps {
  date: string
  slots: Slot[]
  timezone: string
  selectedSlot: Slot | null
  onSelectSlot: (slot: Slot) => void
  onBack: () => void
}

function formatTime(isoString: string, timezone: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString))
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })
}

export function TimeStep({
  date,
  slots,
  timezone,
  selectedSlot,
  onSelectSlot,
  onBack,
}: TimeStepProps) {
  const slotsForDate = slots.filter((s) => s.date === date)

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{formatDate(date)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          ご希望の時間帯を選択してください
        </p>
      </div>

      {slotsForDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <p className="text-sm">この日の空き枠がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {slotsForDate.map((slot) => {
            const isSelected =
              selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
            const startTime = formatTime(slot.start, timezone)
            const endTime = formatTime(slot.end, timezone)

            return (
              <button
                key={slot.start}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-3 rounded-lg border text-sm font-medium transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                )}
              >
                <span className="text-base font-semibold">{startTime}</span>
                <span className={cn("text-xs", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  〜 {endTime}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 戻る
        </Button>
      </div>
    </div>
  )
}
