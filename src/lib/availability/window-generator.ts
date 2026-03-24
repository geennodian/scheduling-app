import { TimeInterval } from './types'

interface WindowGeneratorParams {
  startDate: Date
  endDate: Date
  timezone: string
  weekdayRules: { weekday: number; enabled: boolean }[] // 0=Sun...6=Sat
  timeRules: { startTime: string; endTime: string }[] // "09:00", "18:00"
}

/**
 * Parse a Date into its year/month/day/hour/minute/weekday components
 * in a specific timezone using Intl.DateTimeFormat.
 */
function getPartsInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)

  const weekdayStr = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }

  let hour = get('hour')
  if (hour === 24) hour = 0

  return {
    year: get('year'),
    month: get('month') - 1, // 0-indexed
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second'),
    weekday: dayMap[weekdayStr] ?? 0,
  }
}

/**
 * Create a UTC timestamp for a specific time (hours:minutes) on a specific
 * calendar date in the given timezone.
 *
 * For example: 2024-03-25 09:00 in Asia/Tokyo → the UTC ms when it is
 * 09:00 on March 25 in Tokyo (i.e. 00:00 UTC).
 *
 * Approach:
 *  1. Build a "naive UTC" timestamp: Date.UTC(year, month, day, hour, min).
 *  2. Find the timezone offset at that approximate instant.
 *  3. Subtract the offset to get the true UTC timestamp.
 *  4. Verify the result lands on the right local time; if not (DST edge),
 *     re-compute the offset at the corrected instant and adjust.
 */
function createTimestampInTimezone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): number {
  // Step 1: naive UTC
  const naiveUtc = Date.UTC(year, month, day, hour, minute, 0, 0)

  // Step 2: offset at the naive point
  const offset1 = computeOffsetMs(new Date(naiveUtc), timezone)

  // Step 3: first estimate of true UTC
  const estimate = naiveUtc - offset1

  // Step 4: verify — recompute offset at the estimate
  const offset2 = computeOffsetMs(new Date(estimate), timezone)
  if (offset1 !== offset2) {
    // DST transition edge case — use the second offset
    return naiveUtc - offset2
  }

  return estimate
}

/**
 * Compute the UTC offset in milliseconds for a timezone at a given instant.
 * offset = localClockAsUtc - actualUtc
 * A positive offset means the timezone is ahead of UTC.
 */
function computeOffsetMs(date: Date, timezone: string): number {
  const parts = getPartsInTimezone(date, timezone)
  const localAsUtc = Date.UTC(
    parts.year, parts.month, parts.day,
    parts.hour, parts.minute, parts.second
  )
  return localAsUtc - date.getTime()
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

  // Determine the date range in the target timezone.
  // Get the calendar date of startDate and endDate in the target timezone,
  // then iterate over each calendar day.
  const startParts = getPartsInTimezone(startDate, timezone)
  const endParts = getPartsInTimezone(endDate, timezone)

  // Convert to simple day counts for iteration
  // Use Date.UTC to create comparable day values (ignoring time)
  const startDayUtc = Date.UTC(startParts.year, startParts.month, startParts.day)
  const endDayUtc = Date.UTC(endParts.year, endParts.month, endParts.day)
  const totalDays = Math.round((endDayUtc - startDayUtc) / (24 * 60 * 60 * 1000)) + 1

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    // Calculate the calendar date for this day in the target timezone
    const dayMs = startDayUtc + dayOffset * 24 * 60 * 60 * 1000
    const dayDate = new Date(dayMs)
    const year = dayDate.getUTCFullYear()
    const month = dayDate.getUTCMonth()
    const day = dayDate.getUTCDate()

    // Determine day of week for this calendar date in the target timezone.
    // Since we constructed dayMs as Date.UTC(y, m, d), its UTC weekday
    // matches the calendar date's weekday.
    const dayOfWeek = dayDate.getUTCDay()

    if (!enabledWeekdays.has(dayOfWeek)) continue

    for (const timeRule of effectiveTimeRules) {
      const [startHour, startMin] = timeRule.startTime.split(':').map(Number)
      const [endHour, endMin] = timeRule.endTime.split(':').map(Number)

      const windowStart = createTimestampInTimezone(year, month, day, startHour, startMin, timezone)
      const windowEnd = createTimestampInTimezone(year, month, day, endHour, endMin, timezone)

      if (windowEnd > windowStart) {
        windows.push({
          start: windowStart,
          end: windowEnd,
        })
      }
    }
  }

  return windows
}
