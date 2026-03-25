import { TimeInterval, AvailabilitySlot } from './types'

/** Round up a timestamp to the next slot boundary */
function ceilToSlotBoundary(timestamp: number, slotMs: number): number {
  const remainder = timestamp % slotMs
  return remainder === 0 ? timestamp : timestamp + (slotMs - remainder)
}

/** Generate time slots from free intervals */
export function generateSlots(
  freeIntervals: TimeInterval[],
  slotMinutes: number,
  availableCalendarIds?: string[]
): AvailabilitySlot[] {
  const slotMs = slotMinutes * 60 * 1000
  const slots: AvailabilitySlot[] = []

  for (const interval of freeIntervals) {
    // Round up start to next clean slot boundary to avoid :10:49 etc
    let slotStart = ceilToSlotBoundary(interval.start, slotMs)
    while (slotStart + slotMs <= interval.end) {
      const slotEnd = slotStart + slotMs
      const startDate = new Date(slotStart)
      slots.push({
        start: startDate.toISOString(),
        end: new Date(slotEnd).toISOString(),
        date: startDate.toISOString().split('T')[0],
        availableCalendarIds,
      })
      slotStart = slotEnd
    }
  }

  return slots
}

/** Remove slots that overlap with existing bookings or locks */
export function filterOccupiedSlots(
  slots: AvailabilitySlot[],
  occupied: TimeInterval[]
): AvailabilitySlot[] {
  return slots.filter((slot) => {
    const slotStart = new Date(slot.start).getTime()
    const slotEnd = new Date(slot.end).getTime()
    return !occupied.some(
      (occ) => occ.start < slotEnd && occ.end > slotStart
    )
  })
}
