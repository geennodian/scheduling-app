import { type BookingResult } from "./types"

interface CompleteStepProps {
  result: BookingResult
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

export function CompleteStep({ result, timezone }: CompleteStepProps) {
  const startFormatted = formatDateTime(result.startAt, timezone)
  const endTime = formatTime(result.endAt, timezone)

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Success icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">予約が完了しました</h2>
        <p className="text-sm text-muted-foreground">
          確認メールをお送りしました。ご確認ください。
        </p>
      </div>

      {/* Booking summary */}
      <div className="w-full rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground font-medium">予約日時</span>
          <span className="font-semibold text-foreground">
            {startFormatted} 〜 {endTime}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground font-medium">お名前</span>
          <span className="font-semibold text-foreground">{result.personName} 様</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground font-medium">予約ID</span>
          <span className="font-mono text-xs text-muted-foreground">{result.id}</span>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground max-w-sm">
        ご不明な点がございましたら、主催者までお問い合わせください。
        キャンセルをご希望の場合は、確認メール内のリンクよりお手続きください。
      </p>
    </div>
  )
}
