"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StepIndicator } from "./step-indicator"
import { DateStep } from "./date-step"
import { TimeStep } from "./time-step"
import { FormStep } from "./form-step"
import { ConfirmStep } from "./confirm-step"
import { CompleteStep } from "./complete-step"
import {
  type BookingStep,
  type AvailabilityResponse,
  type Slot,
  type BookingFormData,
  type BookingResult,
} from "./types"

interface BookingPageProps {
  slug: string
}

const INITIAL_FORM: BookingFormData = {
  companyName: "",
  personName: "",
  email: "",
  phone: "",
  note: "",
}

export function BookingPage({ slug }: BookingPageProps) {
  const [step, setStep] = React.useState<BookingStep>("date")
  const [availability, setAvailability] = React.useState<AvailabilityResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null)
  const [formData, setFormData] = React.useState<BookingFormData>(INITIAL_FORM)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [bookingResult, setBookingResult] = React.useState<BookingResult | null>(null)

  // Load availability on mount
  React.useEffect(() => {
    async function loadAvailability() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const res = await fetch(`/api/public/${slug}/availability`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setLoadError(data.error ?? "このページは現在ご利用いただけません")
          return
        }
        const data: AvailabilityResponse = await res.json()
        setAvailability(data)
      } catch {
        setLoadError("ページの読み込みに失敗しました。再度お試しください。")
      } finally {
        setIsLoading(false)
      }
    }
    loadAvailability()
  }, [slug])

  async function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setSubmitError(null)

    // Lock the slot optimistically; proceed to form regardless
    try {
      const res = await fetch(`/api/public/${slug}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: slot.start, slotEnd: slot.end }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? "この時間枠は現在ご利用いただけません")
        return
      }
    } catch {
      // Non-fatal: proceed anyway; server will validate on book
    }

    setStep("form")
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          companyName: formData.companyName || undefined,
          personName: formData.personName,
          email: formData.email,
          phone: formData.phone || undefined,
          note: formData.note || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "予約の送信に失敗しました。再度お試しください。"
        setSubmitError(message)
        return
      }

      setBookingResult(data.booking)
      setStep("complete")
    } catch {
      setSubmitError("通信エラーが発生しました。再度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError || !availability) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{loadError ?? "ページが見つかりません"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { page, slots } = availability
  const timezone = page.timezone

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Page header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl leading-snug">{page.title}</CardTitle>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {page.slotMinutes}分
              </Badge>
            </div>
            {page.description && (
              <CardDescription className="text-sm whitespace-pre-wrap">
                {page.description}
              </CardDescription>
            )}
            {page.organizerName && (
              <p className="text-xs text-muted-foreground pt-1">
                担当: {page.organizerName}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Main booking card */}
        <Card>
          <CardContent className="pt-6">
            {/* Show step indicator for non-complete steps */}
            {step !== "complete" && <StepIndicator currentStep={step} />}

            {step === "date" && (
              <DateStep
                slots={slots}
                onSelectDate={(date) => {
                  setSelectedDate(date)
                  setSelectedSlot(null)
                  setSubmitError(null)
                  setStep("time")
                }}
              />
            )}

            {step === "time" && selectedDate && (
              <TimeStep
                date={selectedDate}
                slots={slots}
                timezone={timezone}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                onBack={() => {
                  setStep("date")
                  setSelectedSlot(null)
                  setSubmitError(null)
                }}
              />
            )}

            {step === "form" && selectedSlot && (
              <FormStep
                slot={selectedSlot}
                pageInfo={page}
                formData={formData}
                onFormChange={setFormData}
                onNext={() => {
                  setSubmitError(null)
                  setStep("confirm")
                }}
                onBack={() => setStep("time")}
                timezone={timezone}
              />
            )}

            {step === "confirm" && selectedSlot && (
              <ConfirmStep
                slot={selectedSlot}
                pageInfo={page}
                formData={formData}
                onConfirm={handleConfirmBooking}
                onBack={() => setStep("form")}
                isSubmitting={isSubmitting}
                errorMessage={submitError}
                timezone={timezone}
              />
            )}

            {step === "complete" && bookingResult && (
              <CompleteStep result={bookingResult} timezone={timezone} />
            )}
          </CardContent>
        </Card>

        {/* Time zone notice */}
        {step !== "complete" && (
          <p className="text-center text-xs text-muted-foreground">
            表示時刻はタイムゾーン: {timezone}
          </p>
        )}
      </div>
    </div>
  )
}
