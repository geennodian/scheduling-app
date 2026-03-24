import { TimeInterval, AvailabilitySlot, CalendarFreeIntervals } from './types'
import { intersectIntervals, unionIntervals } from './interval-ops'
import { calculateAllCalendarFreeIntervals } from './free-intervals'
import { generateSlots, filterOccupiedSlots } from './slot-generator'

export interface CalculateAvailabilityParams {
  calendarBusyIntervals: Map<string, TimeInterval[]>
  availabilityWindows: TimeInterval[]
  mode: 'COMMON_FREE' | 'ANY_FREE'
  slotMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  existingBookings: TimeInterval[]
  existingLocks: TimeInterval[]
}

export function calculateAvailability(
  params: CalculateAvailabilityParams
): AvailabilitySlot[] {
  const {
    calendarBusyIntervals,
    availabilityWindows,
    mode,
    slotMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    existingBookings,
    existingLocks,
  } = params

  // Step 1: Calculate free intervals for each calendar
  const allCalendarFree = calculateAllCalendarFreeIntervals(
    calendarBusyIntervals,
    availabilityWindows,
    bufferBeforeMinutes,
    bufferAfterMinutes
  )

  if (allCalendarFree.length === 0) return []

  let combinedFree: TimeInterval[]
  let slots: AvailabilitySlot[]

  if (mode === 'COMMON_FREE') {
    // Step 2a: Intersect all calendars' free intervals
    combinedFree = allCalendarFree[0].freeIntervals
    for (let i = 1; i < allCalendarFree.length; i++) {
      combinedFree = intersectIntervals(combinedFree, allCalendarFree[i].freeIntervals)
    }
    const allCalendarIds = allCalendarFree.map(c => c.calendarId)
    slots = generateSlots(combinedFree, slotMinutes, allCalendarIds)
  } else {
    // Step 2b: ANY_FREE mode - union, but track which calendars are free per slot
    combinedFree = allCalendarFree[0].freeIntervals
    for (let i = 1; i < allCalendarFree.length; i++) {
      combinedFree = unionIntervals(combinedFree, allCalendarFree[i].freeIntervals)
    }
    // Generate basic slots from union
    const basicSlots = generateSlots(combinedFree, slotMinutes)

    // For each slot, determine which calendars are available
    slots = basicSlots.map(slot => {
      const slotStart = new Date(slot.start).getTime()
      const slotEnd = new Date(slot.end).getTime()
      const slotInterval: TimeInterval = { start: slotStart, end: slotEnd }

      const availableCalendarIds = allCalendarFree
        .filter(cal => {
          // Check if this calendar has free time covering the entire slot
          return cal.freeIntervals.some(
            fi => fi.start <= slotInterval.start && fi.end >= slotInterval.end
          )
        })
        .map(cal => cal.calendarId)

      return { ...slot, availableCalendarIds }
    }).filter(slot => slot.availableCalendarIds && slot.availableCalendarIds.length > 0)
  }

  // Step 3: Remove occupied slots
  const occupied = [...existingBookings, ...existingLocks]
  slots = filterOccupiedSlots(slots, occupied)

  // Step 4: Remove past slots
  const now = Date.now()
  slots = slots.filter(slot => new Date(slot.start).getTime() > now)

  return slots
}
