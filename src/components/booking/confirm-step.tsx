"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type BookingFormData, type PageInfo, type Slot } from "./types"

interface ConfirmStepProps {
  slot: Slot
  pageInfo: PageInfo
  formData: BookingFormData
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
  errorMessage: string | null
  timezone: string
}

function formatDateTime(isoString: string, timezone: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString))
}

function formatTime(isoString: string, timezone: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString))
}

interface ConfirmRowProps {
  label: string
  value: string
}

function ConfirmRow({ label, value }: ConfirmRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="text-xs font-medium text-muted-foreground w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export function ConfirmStep({
  slot,
  pageInfo,
  formData,
  onConfirm,
  onBack,
  isSubmitting,
  errorMessage,
  timezone,
}: ConfirmStepProps) {
  const startFormatted = formatDateTime(slot.start, timezone)
  const endTime = formatTime(slot.end, timezone)

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">以下の内容で予約を確定しますか？</p>
      </div>

      {/* Booking details */}
      <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">予約内容</h3>
        <Separator />
        <ConfirmRow label="日時" value={`${startFormatted} 〜 ${endTime}`} />
        <ConfirmRow label="所要時間" value={`${pageInfo.slotMinutes}分`} />
        {pageInfo.organizerName && (
          <ConfirmRow label="担当者" value={pageInfo.organizerName} />
        )}
      </div>

      {/* Personal details */}
      <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">お客様情報</h3>
        <Separator />
        {formData.companyName && (
          <ConfirmRow label="会社名" value={formData.companyName} />
        )}
        {formData.personName && (
          <ConfirmRow label="お名前" value={formData.personName} />
        )}
        {formData.email && (
          <ConfirmRow label="メールアドレス" value={formData.email} />
        )}
        {formData.phone && (
          <ConfirmRow label="電話番号" value={formData.phone} />
        )}
        {formData.note && (
          <ConfirmRow label="備考" value={formData.note} />
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isSubmitting}>
          ← 戻る
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              送信中...
            </span>
          ) : (
            "予約を確定する"
          )}
        </Button>
      </div>
    </div>
  )
}
