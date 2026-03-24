import { describe, it, expect } from 'vitest'
import {
  sortIntervals,
  mergeIntervals,
  subtractIntervals,
  intersectIntervals,
  unionIntervals,
  applyBuffer,
} from '@/lib/availability/interval-ops'
import { TimeInterval } from '@/lib/availability/types'

// Helper: t(hours) returns ms offset from a base time (2026-01-01T00:00:00Z)
const BASE = new Date('2026-01-01T00:00:00Z').getTime()
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function t(hours: number): number {
  return BASE + hours * HOUR
}

function interval(startH: number, endH: number): TimeInterval {
  return { start: t(startH), end: t(endH) }
}

// ---------- sortIntervals ----------
describe('sortIntervals', () => {
  it('should sort intervals by start time in ascending order', () => {
    const input = [interval(3, 5), interval(1, 2), interval(2, 4)]
    const result = sortIntervals(input)
    expect(result).toEqual([interval(1, 2), interval(2, 4), interval(3, 5)])
  })

  it('should return an empty array for empty input', () => {
    expect(sortIntervals([])).toEqual([])
  })

  it('should handle a single interval', () => {
    const input = [interval(5, 10)]
    expect(sortIntervals(input)).toEqual([interval(5, 10)])
  })

  it('should handle intervals with the same start time', () => {
    const input = [interval(1, 5), interval(1, 3)]
    const result = sortIntervals(input)
    expect(result[0].start).toBe(t(1))
    expect(result[1].start).toBe(t(1))
  })

  it('should not mutate the original array', () => {
    const input = [interval(3, 5), interval(1, 2)]
    const original = [...input]
    sortIntervals(input)
    expect(input).toEqual(original)
  })
})

// ---------- mergeIntervals ----------
describe('mergeIntervals', () => {
  it('should merge overlapping intervals', () => {
    const input = [interval(1, 4), interval(3, 6)]
    expect(mergeIntervals(input)).toEqual([interval(1, 6)])
  })

  it('should merge adjacent intervals (end == start)', () => {
    const input = [interval(1, 3), interval(3, 5)]
    expect(mergeIntervals(input)).toEqual([interval(1, 5)])
  })

  it('should not merge non-overlapping intervals', () => {
    const input = [interval(1, 2), interval(4, 5)]
    expect(mergeIntervals(input)).toEqual([interval(1, 2), interval(4, 5)])
  })

  it('should return empty array for empty input', () => {
    expect(mergeIntervals([])).toEqual([])
  })

  it('should merge multiple overlapping intervals into one', () => {
    const input = [interval(1, 3), interval(2, 5), interval(4, 8)]
    expect(mergeIntervals(input)).toEqual([interval(1, 8)])
  })

  it('should merge contained intervals correctly', () => {
    const input = [interval(1, 10), interval(3, 5)]
    expect(mergeIntervals(input)).toEqual([interval(1, 10)])
  })

  it('should handle unsorted input', () => {
    const input = [interval(5, 7), interval(1, 3), interval(2, 6)]
    expect(mergeIntervals(input)).toEqual([interval(1, 7)])
  })

  it('should handle a single interval', () => {
    expect(mergeIntervals([interval(2, 4)])).toEqual([interval(2, 4)])
  })
})

// ---------- subtractIntervals ----------
describe('subtractIntervals', () => {
  it('should subtract busy interval from the middle of a free interval', () => {
    const free = [interval(1, 10)]
    const busy = [interval(3, 5)]
    expect(subtractIntervals(free, busy)).toEqual([
      interval(1, 3),
      interval(5, 10),
    ])
  })

  it('should subtract busy interval at the start of free', () => {
    const free = [interval(1, 10)]
    const busy = [interval(1, 3)]
    expect(subtractIntervals(free, busy)).toEqual([interval(3, 10)])
  })

  it('should subtract busy interval at the end of free', () => {
    const free = [interval(1, 10)]
    const busy = [interval(8, 10)]
    expect(subtractIntervals(free, busy)).toEqual([interval(1, 8)])
  })

  it('should handle busy spanning the entire free interval', () => {
    const free = [interval(1, 5)]
    const busy = [interval(0, 6)]
    expect(subtractIntervals(free, busy)).toEqual([])
  })

  it('should handle busy spanning multiple free intervals', () => {
    const free = [interval(1, 3), interval(5, 7), interval(9, 11)]
    const busy = [interval(2, 10)]
    expect(subtractIntervals(free, busy)).toEqual([
      interval(1, 2),
      interval(10, 11),
    ])
  })

  it('should return free as-is when no overlap with busy', () => {
    const free = [interval(1, 3)]
    const busy = [interval(5, 7)]
    expect(subtractIntervals(free, busy)).toEqual([interval(1, 3)])
  })

  it('should return empty array when free is empty', () => {
    expect(subtractIntervals([], [interval(1, 3)])).toEqual([])
  })

  it('should return copy of free when busy is empty', () => {
    const free = [interval(1, 5)]
    const result = subtractIntervals(free, [])
    expect(result).toEqual([interval(1, 5)])
  })

  it('should handle multiple busy intervals within one free interval', () => {
    const free = [interval(0, 20)]
    const busy = [interval(3, 5), interval(8, 10), interval(15, 18)]
    expect(subtractIntervals(free, busy)).toEqual([
      interval(0, 3),
      interval(5, 8),
      interval(10, 15),
      interval(18, 20),
    ])
  })

  it('should handle overlapping busy intervals', () => {
    const free = [interval(0, 10)]
    const busy = [interval(2, 5), interval(4, 7)]
    expect(subtractIntervals(free, busy)).toEqual([
      interval(0, 2),
      interval(7, 10),
    ])
  })
})

// ---------- intersectIntervals ----------
describe('intersectIntervals', () => {
  it('should return overlapping portion of two interval sets', () => {
    const a = [interval(1, 5)]
    const b = [interval(3, 7)]
    expect(intersectIntervals(a, b)).toEqual([interval(3, 5)])
  })

  it('should handle fully contained intervals', () => {
    const a = [interval(1, 10)]
    const b = [interval(3, 5)]
    expect(intersectIntervals(a, b)).toEqual([interval(3, 5)])
  })

  it('should return empty when no overlap', () => {
    const a = [interval(1, 3)]
    const b = [interval(5, 7)]
    expect(intersectIntervals(a, b)).toEqual([])
  })

  it('should return empty when either input is empty', () => {
    expect(intersectIntervals([], [interval(1, 5)])).toEqual([])
    expect(intersectIntervals([interval(1, 5)], [])).toEqual([])
  })

  it('should return empty when intervals just touch (no overlap)', () => {
    const a = [interval(1, 3)]
    const b = [interval(3, 5)]
    // start < end check means touching intervals don't overlap
    expect(intersectIntervals(a, b)).toEqual([])
  })

  it('should handle multiple intervals from both sets', () => {
    const a = [interval(0, 4), interval(6, 10)]
    const b = [interval(3, 7)]
    expect(intersectIntervals(a, b)).toEqual([
      interval(3, 4),
      interval(6, 7),
    ])
  })

  it('should handle identical intervals', () => {
    const a = [interval(2, 8)]
    const b = [interval(2, 8)]
    expect(intersectIntervals(a, b)).toEqual([interval(2, 8)])
  })
})

// ---------- unionIntervals ----------
describe('unionIntervals', () => {
  it('should merge overlapping intervals from both sets', () => {
    const a = [interval(1, 5)]
    const b = [interval(3, 7)]
    expect(unionIntervals(a, b)).toEqual([interval(1, 7)])
  })

  it('should keep non-overlapping intervals separate', () => {
    const a = [interval(1, 3)]
    const b = [interval(5, 7)]
    expect(unionIntervals(a, b)).toEqual([interval(1, 3), interval(5, 7)])
  })

  it('should handle empty inputs', () => {
    expect(unionIntervals([], [])).toEqual([])
    expect(unionIntervals([interval(1, 3)], [])).toEqual([interval(1, 3)])
    expect(unionIntervals([], [interval(1, 3)])).toEqual([interval(1, 3)])
  })

  it('should merge adjacent intervals', () => {
    const a = [interval(1, 3)]
    const b = [interval(3, 5)]
    expect(unionIntervals(a, b)).toEqual([interval(1, 5)])
  })

  it('should handle complex multi-interval merge', () => {
    const a = [interval(1, 3), interval(7, 9)]
    const b = [interval(2, 8)]
    expect(unionIntervals(a, b)).toEqual([interval(1, 9)])
  })
})

// ---------- applyBuffer ----------
describe('applyBuffer', () => {
  it('should expand intervals by the specified buffer', () => {
    const input = [interval(5, 10)]
    const result = applyBuffer(input, 30, 15) // 30 min before, 15 min after
    expect(result).toEqual([
      { start: t(5) - 30 * MIN, end: t(10) + 15 * MIN },
    ])
  })

  it('should apply zero buffer (no change)', () => {
    const input = [interval(5, 10)]
    const result = applyBuffer(input, 0, 0)
    expect(result).toEqual([interval(5, 10)])
  })

  it('should handle empty input', () => {
    expect(applyBuffer([], 30, 30)).toEqual([])
  })

  it('should apply buffer to multiple intervals independently', () => {
    const input = [interval(2, 4), interval(8, 10)]
    const result = applyBuffer(input, 15, 15)
    expect(result).toEqual([
      { start: t(2) - 15 * MIN, end: t(4) + 15 * MIN },
      { start: t(8) - 15 * MIN, end: t(10) + 15 * MIN },
    ])
  })

  it('should handle asymmetric buffer (before only)', () => {
    const input = [interval(5, 7)]
    const result = applyBuffer(input, 60, 0)
    expect(result).toEqual([{ start: t(4), end: t(7) }])
  })

  it('should handle asymmetric buffer (after only)', () => {
    const input = [interval(5, 7)]
    const result = applyBuffer(input, 0, 60)
    expect(result).toEqual([{ start: t(5), end: t(8) }])
  })
})
