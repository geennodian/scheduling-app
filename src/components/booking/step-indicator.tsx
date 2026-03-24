import { cn } from "@/lib/utils"
import { type BookingStep } from "./types"

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "date", label: "日付選択" },
  { key: "time", label: "時間選択" },
  { key: "form", label: "情報入力" },
  { key: "complete", label: "完了" },
]

const STEP_ORDER: BookingStep[] = ["date", "time", "form", "confirm", "complete"]

function getStepIndex(step: BookingStep): number {
  return STEP_ORDER.indexOf(step)
}

interface StepIndicatorProps {
  currentStep: BookingStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep)
  // Map confirm to form index for display purposes
  const displayIndex = currentStep === "confirm" ? 2 : currentIndex

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, index) => {
        const stepDisplayIndex = index
        const isCompleted = displayIndex > stepDisplayIndex
        const isCurrent = displayIndex === stepDisplayIndex

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent ? "text-primary" : isCompleted ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 sm:w-12 mx-1 mb-4 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
