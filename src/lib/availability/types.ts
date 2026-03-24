export interface TimeInterval {
  start: number // Unix timestamp ms
  end: number   // Unix timestamp ms
}

export interface AvailabilitySlot {
  start: string  // ISO string
  end: string    // ISO string
  date: string   // YYYY-MM-DD
  availableCalendarIds?: string[] // For ANY_FREE mode
  availableGroupIds?: string[] // For group-based ANY_FREE mode
}

export interface AvailabilityRequest {
  calendarBusyIntervals: Map<string, TimeInterval[]>
  availabilityWindows: TimeInterval[]
  mode: 'COMMON_FREE' | 'ANY_FREE'
  slotMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  existingBookings: TimeInterval[]
  existingLocks: TimeInterval[]
}

export interface CalendarFreeIntervals {
  calendarId: string
  freeIntervals: TimeInterval[]
}

export interface GroupFreeIntervals {
  groupId: string
  groupName: string
  representativeCalendarId?: string // The calendar where events should be created
  freeIntervals: TimeInterval[]
}
