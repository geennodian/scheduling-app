import { TimeInterval } from './types'

/** Sort intervals by start time */
export function sortIntervals(intervals: TimeInterval[]): TimeInterval[] {
  return [...intervals].sort((a, b) => a.start - b.start)
}

/** Merge overlapping intervals into non-overlapping ones */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return []
  const sorted = sortIntervals(intervals)
  const merged: TimeInterval[] = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end)
    } else {
      merged.push({ ...sorted[i] })
    }
  }
  return merged
}

/** Subtract busy intervals from free intervals (free - busy) */
export function subtractIntervals(
  free: TimeInterval[],
  busy: TimeInterval[]
): TimeInterval[] {
  if (free.length === 0) return []
  if (busy.length === 0) return free.map(i => ({ ...i }))

  const mergedBusy = mergeIntervals(busy)
  const result: TimeInterval[] = []

  for (const f of free) {
    let current = f.start
    for (const b of mergedBusy) {
      if (b.end <= f.start) continue
      if (b.start >= f.end) break

      if (b.start > current) {
        result.push({ start: current, end: Math.min(b.start, f.end) })
      }
      current = Math.max(current, b.end)
    }
    if (current < f.end) {
      result.push({ start: current, end: f.end })
    }
  }

  return result
}

/** Intersect two sets of intervals (returns intervals where both overlap) */
export function intersectIntervals(
  a: TimeInterval[],
  b: TimeInterval[]
): TimeInterval[] {
  if (a.length === 0 || b.length === 0) return []

  const sortedA = sortIntervals(a)
  const sortedB = sortIntervals(b)
  const result: TimeInterval[] = []

  let i = 0, j = 0
  while (i < sortedA.length && j < sortedB.length) {
    const start = Math.max(sortedA[i].start, sortedB[j].start)
    const end = Math.min(sortedA[i].end, sortedB[j].end)

    if (start < end) {
      result.push({ start, end })
    }

    if (sortedA[i].end < sortedB[j].end) {
      i++
    } else {
      j++
    }
  }

  return result
}

/** Union two sets of intervals */
export function unionIntervals(
  a: TimeInterval[],
  b: TimeInterval[]
): TimeInterval[] {
  return mergeIntervals([...a, ...b])
}

/** Apply buffer to busy intervals (expand each by before/after minutes) */
export function applyBuffer(
  intervals: TimeInterval[],
  beforeMinutes: number,
  afterMinutes: number
): TimeInterval[] {
  const beforeMs = beforeMinutes * 60 * 1000
  const afterMs = afterMinutes * 60 * 1000
  return intervals.map((i) => ({
    start: i.start - beforeMs,
    end: i.end + afterMs,
  }))
}
