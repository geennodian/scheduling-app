import { TimeInterval } from './types'

interface WindowGeneratorParams {
  startDate: Date
  endDate: Date
  timezone: string
  weekdayRules: { weekday: number; enabled: boolean }[] // 0=Sun...6=Sat
  timeRules: { startTime: string; endTime: string }[] // "09:00", "18:00"
}

/** Generate availability windows for the given date range */
export function generateAvailabilityWindows(
  params: WindowGeneratorParams
): TimeInterval[] {
  const { startDate, endDate, timezone, weekdayRules, timeRules } = params
  const windows: TimeInterval[] = []

  // Default time rule if none provided
  const effectiveTimeRules = timeRules.length > 0
    ? timeRules
    : [{ startTime: '09:00', endTime: '18:00' }]

  // Create enabled weekday set
  const enabledWeekdays = new Set<number>()
  if (weekdayRules.length === 0) {
    // Default: Mon-Fri
    for (let i = 1; i <= 5; i++) enabledWeekdays.add(i)
  } else {
    weekdayRules.forEach(r => { if (r.enabled) enabledWeekdays.add(r.weekday) })
  }

  // Iterate through each day
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    const dayOfWeek = current.getDay()

    if (enabledWeekdays.has(dayOfWeek)) {
      for (const timeRule of effectiveTimeRules) {
        const [startHour, startMin] = timeRule.startTime.split(':').map(Number)
        const [endHour, endMin] = timeRule.endTime.split(':').map(Number)

        const windowStart = new Date(current)
        windowStart.setHours(startHour, startMin, 0, 0)

        const windowEnd = new Date(current)
        windowEnd.setHours(endHour, endMin, 0, 0)

        if (windowEnd > windowStart) {
          windows.push({
            start: windowStart.getTime(),
            end: windowEnd.getTime(),
          })
        }
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return windows
}
