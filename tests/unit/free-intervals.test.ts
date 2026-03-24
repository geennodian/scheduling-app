import { describe, it, expect } from 'vitest'
import {
  calculateFreeIntervals,
  calculateAllCalendarFreeIntervals,
} from '@/lib/availability/free-intervals'
import { TimeInterval } from '@/lib/availability/types'

const BASE = new Date('2026-04-01T00:00:00Z').getTime()
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function t(hours: number): number {
  return BASE + hours * HOUR
}

function interval(startH: number, endH: number): TimeInterval {
  return { start: t(startH), end: t(endH) }
}

// ---------- calculateFreeIntervals ----------
describe('calculateFreeIntervals', () => {
  it('should return full window when there are no busy intervals', () => {
    const windows = [interval(9, 17)]
    const result = calculateFreeIntervals(windows, [], 0, 0)
    expect(result).toEqual([interval(9, 17)])
  })

  it('should subtract busy intervals from availability windows', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(12, 13)]
    const result = calculateFreeIntervals(windows, busy, 0, 0)
    expect(result).toEqual([interval(9, 12), interval(13, 17)])
  })

  it('should apply buffer before busy intervals', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(12, 13)] // with 30min buffer becomes 11:30 - 13:00
    const result = calculateFreeIntervals(windows, busy, 30, 0)
    expect(result).toEqual([
      { start: t(9), end: t(12) - 30 * MIN },
      interval(13, 17),
    ])
  })

  it('should apply buffer after busy intervals', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(12, 13)] // with 15min after buffer becomes 12:00 - 13:15
    const result = calculateFreeIntervals(windows, busy, 0, 15)
    expect(result).toEqual([
      interval(9, 12),
      { start: t(13) + 15 * MIN, end: t(17) },
    ])
  })

  it('should apply both before and after buffers', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(12, 13)] // becomes 11:30 - 13:30
    const result = calculateFreeIntervals(windows, busy, 30, 30)
    expect(result).toEqual([
      { start: t(9), end: t(12) - 30 * MIN },
      { start: t(13) + 30 * MIN, end: t(17) },
    ])
  })

  it('should handle busy intervals outside the window', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(5, 7)] // completely before
    const result = calculateFreeIntervals(windows, busy, 0, 0)
    expect(result).toEqual([interval(9, 17)])
  })

  it('should handle busy intervals that completely cover the window', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(8, 18)]
    const result = calculateFreeIntervals(windows, busy, 0, 0)
    expect(result).toEqual([])
  })

  it('should handle empty windows', () => {
    const result = calculateFreeIntervals([], [interval(12, 13)], 0, 0)
    expect(result).toEqual([])
  })

  it('should handle multiple busy intervals with buffer', () => {
    const windows = [interval(9, 17)]
    const busy = [interval(10, 11), interval(14, 15)]
    // with 15 min buffer each: 9:45-11:15, 13:45-15:15
    const result = calculateFreeIntervals(windows, busy, 15, 15)
    expect(result).toEqual([
      { start: t(9), end: t(10) - 15 * MIN },
      { start: t(11) + 15 * MIN, end: t(14) - 15 * MIN },
      { start: t(15) + 15 * MIN, end: t(17) },
    ])
  })
})

// ---------- calculateAllCalendarFreeIntervals ----------
describe('calculateAllCalendarFreeIntervals', () => {
  it('should calculate free intervals for each calendar independently', () => {
    const calendarBusy = new Map<string, TimeInterval[]>([
      ['cal-a', [interval(10, 11)]],
      ['cal-b', [interval(14, 15)]],
    ])
    const windows = [interval(9, 17)]

    const result = calculateAllCalendarFreeIntervals(calendarBusy, windows, 0, 0)
    expect(result).toHaveLength(2)

    const calA = result.find(r => r.calendarId === 'cal-a')!
    expect(calA.freeIntervals).toEqual([interval(9, 10), interval(11, 17)])

    const calB = result.find(r => r.calendarId === 'cal-b')!
    expect(calB.freeIntervals).toEqual([interval(9, 14), interval(15, 17)])
  })

  it('should handle empty calendar map', () => {
    const calendarBusy = new Map<string, TimeInterval[]>()
    const result = calculateAllCalendarFreeIntervals(
      calendarBusy, [interval(9, 17)], 0, 0
    )
    expect(result).toEqual([])
  })

  it('should pass buffer parameters to each calendar', () => {
    const calendarBusy = new Map<string, TimeInterval[]>([
      ['cal-a', [interval(12, 13)]],
    ])
    const windows = [interval(9, 17)]
    const result = calculateAllCalendarFreeIntervals(calendarBusy, windows, 30, 0)

    const calA = result[0]
    // busy 12-13 with 30 min before buffer becomes 11:30-13:00
    expect(calA.freeIntervals).toEqual([
      { start: t(9), end: t(12) - 30 * MIN },
      interval(13, 17),
    ])
  })

  it('should handle calendar with no busy intervals', () => {
    const calendarBusy = new Map<string, TimeInterval[]>([
      ['cal-empty', []],
    ])
    const windows = [interval(9, 17)]
    const result = calculateAllCalendarFreeIntervals(calendarBusy, windows, 0, 0)
    expect(result[0].freeIntervals).toEqual([interval(9, 17)])
  })
})
