import { describe, it, expect } from 'vitest'
import { generateSlots, filterOccupiedSlots } from '@/lib/availability/slot-generator'
import { TimeInterval, AvailabilitySlot } from '@/lib/availability/types'

const BASE = new Date('2026-04-01T00:00:00Z').getTime()
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function t(hours: number): number {
  return BASE + hours * HOUR
}

function interval(startH: number, endH: number): TimeInterval {
  return { start: t(startH), end: t(endH) }
}

// ---------- generateSlots ----------
describe('generateSlots', () => {
  it('should generate 30-minute slots from a 2-hour free interval', () => {
    const freeIntervals = [interval(9, 11)] // 9:00 - 11:00 (2 hours)
    const slots = generateSlots(freeIntervals, 30)
    expect(slots).toHaveLength(4) // 4 x 30min slots
    expect(new Date(slots[0].start).getTime()).toBe(t(9))
    expect(new Date(slots[0].end).getTime()).toBe(t(9) + 30 * MIN)
    expect(new Date(slots[3].end).getTime()).toBe(t(11))
  })

  it('should generate 60-minute slots from a 3-hour free interval', () => {
    const freeIntervals = [interval(10, 13)]
    const slots = generateSlots(freeIntervals, 60)
    expect(slots).toHaveLength(3)
    expect(new Date(slots[0].start).getTime()).toBe(t(10))
    expect(new Date(slots[2].end).getTime()).toBe(t(13))
  })

  it('should not generate a slot if the interval is shorter than slot duration', () => {
    const freeIntervals = [interval(10, 10.4)] // 24 minutes
    const slots = generateSlots(freeIntervals, 30)
    expect(slots).toHaveLength(0)
  })

  it('should not generate a partial slot at the end', () => {
    const freeIntervals = [interval(9, 10.75)] // 1h 45min
    const slots = generateSlots(freeIntervals, 60)
    expect(slots).toHaveLength(1) // Only 1 full 60-min slot fits
    expect(new Date(slots[0].start).getTime()).toBe(t(9))
    expect(new Date(slots[0].end).getTime()).toBe(t(10))
  })

  it('should handle multiple free intervals', () => {
    const freeIntervals = [interval(9, 10), interval(14, 16)]
    const slots = generateSlots(freeIntervals, 60)
    expect(slots).toHaveLength(3) // 1 from first + 2 from second
  })

  it('should return empty array for empty free intervals', () => {
    expect(generateSlots([], 30)).toEqual([])
  })

  it('should include availableCalendarIds when provided', () => {
    const freeIntervals = [interval(9, 10)]
    const ids = ['cal-1', 'cal-2']
    const slots = generateSlots(freeIntervals, 60, ids)
    expect(slots).toHaveLength(1)
    expect(slots[0].availableCalendarIds).toEqual(['cal-1', 'cal-2'])
  })

  it('should not include availableCalendarIds when not provided', () => {
    const freeIntervals = [interval(9, 10)]
    const slots = generateSlots(freeIntervals, 60)
    expect(slots[0].availableCalendarIds).toBeUndefined()
  })

  it('should set the date field in YYYY-MM-DD format', () => {
    const freeIntervals = [interval(9, 10)]
    const slots = generateSlots(freeIntervals, 60)
    // 2026-04-01 + 9 hours = 2026-04-01T09:00:00Z
    expect(slots[0].date).toBe('2026-04-01')
  })

  it('should produce ISO strings for start and end', () => {
    const freeIntervals = [interval(9, 10)]
    const slots = generateSlots(freeIntervals, 30)
    expect(slots[0].start).toBe(new Date(t(9)).toISOString())
    expect(slots[0].end).toBe(new Date(t(9) + 30 * MIN).toISOString())
  })
})

// ---------- filterOccupiedSlots ----------
describe('filterOccupiedSlots', () => {
  function makeSlot(startH: number, endH: number): AvailabilitySlot {
    const startDate = new Date(t(startH))
    const endDate = new Date(t(endH))
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      date: startDate.toISOString().split('T')[0],
    }
  }

  it('should filter out slots that overlap with occupied intervals', () => {
    const slots = [makeSlot(9, 10), makeSlot(10, 11), makeSlot(11, 12)]
    const occupied = [interval(10, 11)] // occupies the second slot
    const result = filterOccupiedSlots(slots, occupied)
    expect(result).toHaveLength(2)
    expect(new Date(result[0].start).getTime()).toBe(t(9))
    expect(new Date(result[1].start).getTime()).toBe(t(11))
  })

  it('should filter out slots partially overlapping with occupied', () => {
    const slots = [makeSlot(9, 10), makeSlot(10, 11)]
    const occupied = [interval(9.5, 10.5)] // overlaps both slots
    const result = filterOccupiedSlots(slots, occupied)
    expect(result).toHaveLength(0)
  })

  it('should keep all slots when occupied is empty', () => {
    const slots = [makeSlot(9, 10), makeSlot(10, 11)]
    const result = filterOccupiedSlots(slots, [])
    expect(result).toHaveLength(2)
  })

  it('should return empty when all slots are occupied', () => {
    const slots = [makeSlot(9, 10)]
    const occupied = [interval(8, 12)]
    expect(filterOccupiedSlots(slots, occupied)).toHaveLength(0)
  })

  it('should return empty when slots is empty', () => {
    expect(filterOccupiedSlots([], [interval(9, 10)])).toEqual([])
  })

  it('should not filter slots that merely touch occupied (no actual overlap)', () => {
    const slots = [makeSlot(9, 10), makeSlot(10, 11)]
    // occupied ends exactly when second slot starts (occ.end > slotStart check)
    const occupied = [{ start: t(8), end: t(9) }]
    const result = filterOccupiedSlots(slots, occupied)
    expect(result).toHaveLength(2)
  })

  it('should handle multiple occupied intervals', () => {
    const slots = [
      makeSlot(9, 10),
      makeSlot(10, 11),
      makeSlot(11, 12),
      makeSlot(12, 13),
    ]
    const occupied = [interval(10, 11), interval(12, 13)]
    const result = filterOccupiedSlots(slots, occupied)
    expect(result).toHaveLength(2)
    expect(new Date(result[0].start).getTime()).toBe(t(9))
    expect(new Date(result[1].start).getTime()).toBe(t(11))
  })
})
