export type BookingStep = "date" | "time" | "form" | "confirm" | "complete"

export interface PageInfo {
  title: string
  description: string | null
  organizerName: string | null
  timezone: string
  slotMinutes: number
  mode: "COMMON_FREE" | "ANY_FREE"
  bookingFormSetting?: {
    requireCompany: boolean
    requireName: boolean
    requireEmail: boolean
    requirePhone: boolean
    requireNote: boolean
  }
}

export interface Slot {
  start: string
  end: string
  date: string
  availableCalendarIds?: string[]
  availableGroupIds?: string[]
}

export interface AvailabilityResponse {
  page: PageInfo
  slots: Slot[]
}

export interface BookingFormData {
  companyName: string
  personName: string
  email: string
  phone: string
  note: string
}

export interface BookingResult {
  id: string
  startAt: string
  endAt: string
  personName: string
}
