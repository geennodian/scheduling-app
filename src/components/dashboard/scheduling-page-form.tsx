"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const WEEKDAYS = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
]

const TIMEZONES = [
  { value: "Asia/Tokyo", label: "日本標準時 (JST)" },
  { value: "America/New_York", label: "東部標準時 (ET)" },
  { value: "America/Los_Angeles", label: "太平洋標準時 (PT)" },
  { value: "Europe/London", label: "グリニッジ標準時 (GMT)" },
  { value: "Europe/Paris", label: "中央ヨーロッパ時間 (CET)" },
  { value: "Asia/Singapore", label: "シンガポール標準時 (SGT)" },
]

type ConnectedCalendar = {
  id: string
  calendarId: string
  calendarName: string
  connectedGoogleAccount: {
    googleEmail: string
  }
}

type TimeRule = {
  id?: string
  startTime: string
  endTime: string
}

type FormValues = {
  title: string
  description: string
  organizerName: string
  mode: "COMMON_FREE" | "ANY_FREE"
  timezone: string
  dateRangeDays: number
  slotMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  dailyLimit: string
  isPublished: boolean
  enabledWeekdays: number[]
  timeRules: TimeRule[]
  calendarTargetIds: string[]
  requireCompany: boolean
  requirePhone: boolean
  requireNote: boolean
}

type Props = {
  initialData?: Partial<FormValues>
  pageId?: string
  calendars: ConnectedCalendar[]
}

export function SchedulingPageForm({ initialData, pageId, calendars }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [values, setValues] = useState<FormValues>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    organizerName: initialData?.organizerName ?? "",
    mode: initialData?.mode ?? "COMMON_FREE",
    timezone: initialData?.timezone ?? "Asia/Tokyo",
    dateRangeDays: initialData?.dateRangeDays ?? 30,
    slotMinutes: initialData?.slotMinutes ?? 30,
    bufferBeforeMinutes: initialData?.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: initialData?.bufferAfterMinutes ?? 0,
    dailyLimit: initialData?.dailyLimit?.toString() ?? "",
    isPublished: initialData?.isPublished ?? false,
    enabledWeekdays: initialData?.enabledWeekdays ?? [1, 2, 3, 4, 5],
    timeRules: initialData?.timeRules ?? [{ startTime: "09:00", endTime: "18:00" }],
    calendarTargetIds: initialData?.calendarTargetIds ?? [],
    requireCompany: initialData?.requireCompany ?? false,
    requirePhone: initialData?.requirePhone ?? false,
    requireNote: initialData?.requireNote ?? false,
  })

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const toggleWeekday = (day: number) => {
    set(
      "enabledWeekdays",
      values.enabledWeekdays.includes(day)
        ? values.enabledWeekdays.filter((d) => d !== day)
        : [...values.enabledWeekdays, day]
    )
  }

  const toggleCalendar = (id: string) => {
    set(
      "calendarTargetIds",
      values.calendarTargetIds.includes(id)
        ? values.calendarTargetIds.filter((c) => c !== id)
        : [...values.calendarTargetIds, id]
    )
  }

  const addTimeRule = () => {
    set("timeRules", [...values.timeRules, { startTime: "09:00", endTime: "18:00" }])
  }

  const removeTimeRule = (index: number) => {
    set("timeRules", values.timeRules.filter((_, i) => i !== index))
  }

  const updateTimeRule = (index: number, field: "startTime" | "endTime", value: string) => {
    set(
      "timeRules",
      values.timeRules.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      toast.error("タイトルを入力してください")
      return
    }
    if (values.calendarTargetIds.length === 0) {
      toast.error("カレンダーを1つ以上選択してください")
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...values,
        dailyLimit: values.dailyLimit ? Number(values.dailyLimit) : null,
      }

      const url = pageId ? `/api/scheduling-pages/${pageId}` : "/api/scheduling-pages"
      const method = pageId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "保存に失敗しました")
      }

      toast.success(pageId ? "調整ページを更新しました" : "調整ページを作成しました")
      router.push("/scheduling-pages")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="例：30分ミーティング"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="このページの説明を入力してください"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerName">主催者名</Label>
            <Input
              id="organizerName"
              value={values.organizerName}
              onChange={(e) => set("organizerName", e.target.value)}
              placeholder="例：田中 太郎"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublished" className="text-sm font-medium">公開設定</Label>
              <p className="text-xs text-gray-500">オンにすると外部からアクセス可能になります</p>
            </div>
            <Switch
              id="isPublished"
              checked={values.isPublished}
              onCheckedChange={(v) => set("isPublished", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">スケジュール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>空き時間モード</Label>
              <Select
                value={values.mode}
                onValueChange={(v) => v && set("mode", v as "COMMON_FREE" | "ANY_FREE")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMON_FREE">全員共通の空き時間</SelectItem>
                  <SelectItem value="ANY_FREE">誰かの空き時間</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>タイムゾーン</Label>
              <Select
                value={values.timezone}
                onValueChange={(v) => v && set("timezone", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRangeDays">予約可能期間（日）</Label>
              <Input
                id="dateRangeDays"
                type="number"
                min={1}
                max={365}
                value={values.dateRangeDays}
                onChange={(e) => set("dateRangeDays", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>スロット間隔</Label>
              <Select
                value={String(values.slotMinutes)}
                onValueChange={(v) => v && set("slotMinutes", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15分</SelectItem>
                  <SelectItem value="30">30分</SelectItem>
                  <SelectItem value="60">60分</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bufferBefore">前のバッファ（分）</Label>
              <Input
                id="bufferBefore"
                type="number"
                min={0}
                value={values.bufferBeforeMinutes}
                onChange={(e) => set("bufferBeforeMinutes", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bufferAfter">後のバッファ（分）</Label>
              <Input
                id="bufferAfter"
                type="number"
                min={0}
                value={values.bufferAfterMinutes}
                onChange={(e) => set("bufferAfterMinutes", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyLimit">1日の予約上限（空欄で無制限）</Label>
            <Input
              id="dailyLimit"
              type="number"
              min={1}
              value={values.dailyLimit}
              onChange={(e) => set("dailyLimit", e.target.value)}
              placeholder="例：5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Weekday rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">受付曜日</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer text-sm font-medium transition-colors
                  ${values.enabledWeekdays.includes(value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={values.enabledWeekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">受付時間帯</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addTimeRule}>
              時間帯を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {values.timeRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                type="time"
                value={rule.startTime}
                onChange={(e) => updateTimeRule(index, "startTime", e.target.value)}
                className="w-32"
              />
              <span className="text-gray-500">〜</span>
              <Input
                type="time"
                value={rule.endTime}
                onChange={(e) => updateTimeRule(index, "endTime", e.target.value)}
                className="w-32"
              />
              {values.timeRules.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => removeTimeRule(index)}
                >
                  削除
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calendar targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            対象カレンダー <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calendars.length === 0 ? (
            <p className="text-sm text-gray-500">
              カレンダーがありません。先にGoogleアカウントを連携してください。
            </p>
          ) : (
            <div className="space-y-2">
              {calendars.map((cal) => (
                <div key={cal.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`cal-${cal.id}`}
                    checked={values.calendarTargetIds.includes(cal.id)}
                    onCheckedChange={() => toggleCalendar(cal.id)}
                  />
                  <Label htmlFor={`cal-${cal.id}`} className="cursor-pointer">
                    <span className="font-medium">{cal.calendarName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {cal.connectedGoogleAccount.googleEmail}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">予約フォーム設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            ※ お名前とメールアドレスは常に必須です
          </p>
          <div className="flex items-center gap-3">
            <Switch
              id="requireCompany"
              checked={values.requireCompany}
              onCheckedChange={(v) => set("requireCompany", v)}
            />
            <Label htmlFor="requireCompany">会社名を必須にする</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="requirePhone"
              checked={values.requirePhone}
              onCheckedChange={(v) => set("requirePhone", v)}
            />
            <Label htmlFor="requirePhone">電話番号を必須にする</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="requireNote"
              checked={values.requireNote}
              onCheckedChange={(v) => set("requireNote", v)}
            />
            <Label htmlFor="requireNote">備考欄を表示する</Label>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : pageId ? "更新する" : "作成する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/scheduling-pages")}
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
