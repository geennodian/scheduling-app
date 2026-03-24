"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type BookingFormData, type PageInfo, type Slot } from "./types"

interface FormStepProps {
  slot: Slot
  pageInfo: PageInfo
  formData: BookingFormData
  onFormChange: (data: BookingFormData) => void
  onNext: () => void
  onBack: () => void
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

export function FormStep({
  slot,
  pageInfo,
  formData,
  onFormChange,
  onNext,
  onBack,
  timezone,
}: FormStepProps) {
  const [errors, setErrors] = React.useState<Partial<Record<keyof BookingFormData, string>>>({})

  const settings = pageInfo.bookingFormSetting ?? {
    requireCompany: false,
    requireName: true,
    requireEmail: true,
    requirePhone: false,
    requireNote: false,
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {}

    if (settings.requireCompany && !formData.companyName.trim()) {
      newErrors.companyName = "会社名を入力してください"
    }
    if (settings.requireName && !formData.personName.trim()) {
      newErrors.personName = "お名前を入力してください"
    }
    if (settings.requireEmail) {
      if (!formData.email.trim()) {
        newErrors.email = "メールアドレスを入力してください"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "正しいメールアドレスを入力してください"
      }
    }
    if (settings.requirePhone && !formData.phone.trim()) {
      newErrors.phone = "電話番号を入力してください"
    }
    if (settings.requireNote && !formData.note.trim()) {
      newErrors.note = "備考を入力してください"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onNext()
    }
  }

  function update(field: keyof BookingFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFormChange({ ...formData, [field]: e.target.value })
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  const startFormatted = formatDateTime(slot.start, timezone)
  const endTime = formatTime(slot.end, timezone)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Selected slot summary */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
        <p className="font-medium text-primary">{startFormatted} 〜 {endTime}</p>
      </div>

      <p className="text-sm text-muted-foreground">以下の情報をご入力ください</p>

      {/* Company name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">
          会社名
          {settings.requireCompany && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={update("companyName")}
          placeholder="株式会社〇〇"
          className={errors.companyName ? "border-destructive" : ""}
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName}</p>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="personName">
          お名前
          {settings.requireName && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id="personName"
          value={formData.personName}
          onChange={update("personName")}
          placeholder="山田 太郎"
          className={errors.personName ? "border-destructive" : ""}
        />
        {errors.personName && (
          <p className="text-xs text-destructive">{errors.personName}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">
          メールアドレス
          {settings.requireEmail && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={update("email")}
          placeholder="example@company.co.jp"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          電話番号
          {settings.requirePhone ? (
            <span className="text-destructive ml-1">*</span>
          ) : (
            <span className="text-muted-foreground text-xs ml-1">（任意）</span>
          )}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={update("phone")}
          placeholder="03-0000-0000"
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">
          備考
          {settings.requireNote ? (
            <span className="text-destructive ml-1">*</span>
          ) : (
            <span className="text-muted-foreground text-xs ml-1">（任意）</span>
          )}
        </Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={update("note")}
          placeholder="ご質問やご要望があればご記入ください"
          rows={3}
          className={errors.note ? "border-destructive" : ""}
        />
        {errors.note && (
          <p className="text-xs text-destructive">{errors.note}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          ← 戻る
        </Button>
        <Button type="submit">
          内容を確認する →
        </Button>
      </div>
    </form>
  )
}
