import { TimeInterval } from './types'

interface WindowGeneratorParams {
  startDate: Date
  endDate: Date
  timezone: string
  weekdayRules: { weekday: number; enabled: boolean }[] // 0=Sun...6=Sat
  timeRules: { startTime: string; endTime: string }[] // "09:00", "18:00"
}

/**
 * Get the UTC offset in ms for a given timezone at a given date.
 * Uses Intl.DateTimeFormat to determine the local time in the target timezone.
 */
function getTimezoneOffsetMs(date: Date, timezone: string): number {
  // Format the date parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)

  const year = get('year')
  const month = get('month') - 1
  const day = get('day')
  let hour = get('hour')
  if (hour === 24) hour = 0
  const minute = get('minute')
  const second = get('second')

  // Create a UTC date representing "what the clock says" in the target timezone
  const localAsUtc = Date.UTC(year, month, day, hour, minute, second)

  // The offset = localAsUtc - actualUtc
  return localAsUtc - date.getTime()
}

/**
 * Create a UTC timestamp for a specific time in a specific timezone.
 * E.g., "09:00" in "Asia/Tokyo" → the UTC timestamp when it's 9:00 AM in Tokyo.
 */
function createDateInTimezone(
  baseDate: Date,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Get the date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(baseDate)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)

  const year = get('year')
  const month = get('month') - 1
  const day = get('day')

  // Create a date string in the target timezone and parse it
  // Use a reference point to calculate offset
  const refUtc = Date.UTC(year, month, day, hour, minute, 0, 0)

  // Get the offset for this approximate time
  const approxDate = new Date(refUtc)
  const offset = getTimezoneOffsetMs(approxDate, timezone)

  // The actual UTC time = refUtc - offset
  return new Date(refUtc - offset)
}

/**
 * Get the day of week in a specific timezone.
 */
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  })
  const weekday = formatter.format(date)
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return dayMap[weekday] ?? 0
}

/** Generate availability windows for the given date range, timezone-aware */
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

  // Calculate total days to iterate
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    // Create a reference point for this day (noon UTC to avoid DST edge cases)
    const refDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)

    // Get the day of week in the target timezone
    const dayOfWeek = getDayOfWeekInTimezone(refDate, timezone)

    if (!enabledWeekdays.has(dayOfWeek)) continue

    for (const timeRule of effectiveTimeRules) {
      const [startHour, startMin] = timeRule.startTime.split(':').map(Number)
      const [endHour, endMin] = timeRule.endTime.split(':').map(Number)

      const windowStart = createDateInTimezone(refDate, startHour, startMin, timezone)
      const windowEnd = createDateInTimezone(refDate, endHour, endMin, timezone)

      if (windowEnd.getTime() > windowStart.getTime()) {
        windows.push({
          start: windowStart.getTime(),
          end: windowEnd.getTime(),
        })
      }
    }
  }

  return windows
}
