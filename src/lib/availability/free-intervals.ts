import { TimeInterval, CalendarFreeIntervals } from './types'
import { subtractIntervals, applyBuffer } from './interval-ops'

/** Calculate free intervals for a single calendar */
export function calculateFreeIntervals(
  availabilityWindows: TimeInterval[],
  busyIntervals: TimeInterval[],
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number
): TimeInterval[] {
  const bufferedBusy = applyBuffer(busyIntervals, bufferBeforeMinutes, bufferAfterMinutes)
  return subtractIntervals(availabilityWindows, bufferedBusy)
}

/** Calculate free intervals for all calendars */
export function calculateAllCalendarFreeIntervals(
  calendarBusyIntervals: Map<string, TimeInterval[]>,
  availabilityWindows: TimeInterval[],
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number
): CalendarFreeIntervals[] {
  const results: CalendarFreeIntervals[] = []
  for (const [calendarId, busyIntervals] of calendarBusyIntervals) {
    results.push({
      calendarId,
      freeIntervals: calculateFreeIntervals(
        availabilityWindows,
        busyIntervals,
        bufferBeforeMinutes,
        bufferAfterMinutes
      ),
    })
  }
  return results
}
