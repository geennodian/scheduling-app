import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateAvailability, CalculateAvailabilityParams } from '@/lib/availability/calculator'
import { TimeInterval } from '@/lib/availability/types'

// Use a far-future base time so slots are never filtered as "past"
const BASE = new Date('2099-06-01T00:00:00Z').getTime()
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function t(hours: number): number {
  return BASE + hours * HOUR
}

function interval(startH: number, endH: number): TimeInterval {
  return { start: t(startH), end: t(endH) }
}

function makeParams(overrides: Partial<CalculateAvailabilityParams>): CalculateAvailabilityParams {
  return {
    calendarBusyIntervals: new Map(),
    availabilityWindows: [interval(9, 17)],
    mode: 'COMMON_FREE',
    slotMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    existingBookings: [],
    existingLocks: [],
    ...overrides,
  }
}

// ---------- COMMON_FREE mode ----------
describe('calculateAvailability - COMMON_FREE mode', () => {
  it('should return slots where all calendars are free', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(10, 11)]],         // busy 10-11
        ['cal-b', [interval(14, 15)]],         // busy 14-15
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)

    // Common free: 9-10, 11-14, 15-17
    // 60-min slots: 9-10, 11-12, 12-13, 13-14, 15-16, 16-17
    expect(slots).toHaveLength(6)

    // All slots should reference both calendars
    for (const slot of slots) {
      expect(slot.availableCalendarIds).toContain('cal-a')
      expect(slot.availableCalendarIds).toContain('cal-b')
    }
  })

  it('should return no slots when calendars have no common free time', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(9, 13)]],    // busy 9-13
        ['cal-b', [interval(13, 17)]],   // busy 13-17
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    expect(slots).toHaveLength(0)
  })

  it('should work with a single calendar', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(12, 13)]],
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    // Free: 9-12, 13-17 => 7 one-hour slots
    expect(slots).toHaveLength(7)
  })
})

// ---------- ANY_FREE mode ----------
describe('calculateAvailability - ANY_FREE mode', () => {
  it('should return slots where at least one calendar is free', () => {
    const params = makeParams({
      mode: 'ANY_FREE',
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(9, 13)]],     // busy 9-13, free 13-17
        ['cal-b', [interval(13, 17)]],    // busy 13-17, free 9-13
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    // Union free: 9-17 (full day, each half from one calendar)
    expect(slots).toHaveLength(8)
  })

  it('should track which calendars are available for each slot', () => {
    const params = makeParams({
      mode: 'ANY_FREE',
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(10, 12)]],    // free: 9-10, 12-17
        ['cal-b', [interval(14, 16)]],    // free: 9-14, 16-17
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)

    // Slot 9-10: both free
    const slot9 = slots.find(s => new Date(s.start).getTime() === t(9))!
    expect(slot9.availableCalendarIds).toContain('cal-a')
    expect(slot9.availableCalendarIds).toContain('cal-b')

    // Slot 10-11: only cal-b free
    const slot10 = slots.find(s => new Date(s.start).getTime() === t(10))!
    expect(slot10.availableCalendarIds).toEqual(['cal-b'])

    // Slot 14-15: only cal-a free
    const slot14 = slots.find(s => new Date(s.start).getTime() === t(14))!
    expect(slot14.availableCalendarIds).toEqual(['cal-a'])
  })

  it('should not return slots where no calendar is free', () => {
    const params = makeParams({
      mode: 'ANY_FREE',
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(10, 12)]],
        ['cal-b', [interval(10, 12)]],
      ]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)

    // Both busy 10-12, so no slots at 10:00 or 11:00
    const busySlots = slots.filter(s => {
      const st = new Date(s.start).getTime()
      return st === t(10) || st === t(11)
    })
    expect(busySlots).toHaveLength(0)
  })
})

// ---------- Existing bookings ----------
describe('calculateAvailability - existing bookings', () => {
  it('should filter out slots overlapping with existing bookings', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      existingBookings: [interval(12, 13)],
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    // 8 total minus 1 occupied = 7
    const hasBookedSlot = slots.some(
      s => new Date(s.start).getTime() === t(12)
    )
    expect(hasBookedSlot).toBe(false)
  })
})

// ---------- Existing locks ----------
describe('calculateAvailability - existing locks', () => {
  it('should filter out slots overlapping with existing locks', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      existingLocks: [interval(15, 16)],
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    const hasLockedSlot = slots.some(
      s => new Date(s.start).getTime() === t(15)
    )
    expect(hasLockedSlot).toBe(false)
  })

  it('should filter slots overlapping with both bookings and locks', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      existingBookings: [interval(10, 11)],
      existingLocks: [interval(14, 15)],
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)

    const hasBookedSlot = slots.some(
      s => new Date(s.start).getTime() === t(10)
    )
    const hasLockedSlot = slots.some(
      s => new Date(s.start).getTime() === t(14)
    )
    expect(hasBookedSlot).toBe(false)
    expect(hasLockedSlot).toBe(false)
  })
})

// ---------- Past slots ----------
describe('calculateAvailability - past slots filtering', () => {
  it('should filter out slots in the past', () => {
    // Use a past base time
    const PAST_BASE = new Date('2020-01-01T00:00:00Z').getTime()
    const pastInterval = (startH: number, endH: number): TimeInterval => ({
      start: PAST_BASE + startH * HOUR,
      end: PAST_BASE + endH * HOUR,
    })

    const params: CalculateAvailabilityParams = {
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [pastInterval(9, 17)],
      mode: 'COMMON_FREE',
      slotMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      existingBookings: [],
      existingLocks: [],
    }

    const slots = calculateAvailability(params)
    // All slots are in the past, so should be filtered out
    expect(slots).toHaveLength(0)
  })

  it('should keep future slots and filter past ones', () => {
    // This test uses the far-future BASE, all slots should be kept
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    expect(slots.length).toBeGreaterThan(0)
  })
})

// ---------- Empty input cases ----------
describe('calculateAvailability - empty inputs', () => {
  it('should return empty when calendarBusyIntervals is empty', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map(),
    })
    const slots = calculateAvailability(params)
    expect(slots).toEqual([])
  })

  it('should return empty when availabilityWindows is empty', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [],
    })
    const slots = calculateAvailability(params)
    expect(slots).toEqual([])
  })

  it('should return empty when window is too small for any slot', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [interval(9, 9.4)], // 24 minutes
      slotMinutes: 30,
    })
    const slots = calculateAvailability(params)
    expect(slots).toEqual([])
  })
})

// ---------- Buffer integration ----------
describe('calculateAvailability - buffer integration', () => {
  it('should apply buffer when calculating availability', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([
        ['cal-a', [interval(12, 13)]],
      ]),
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 30,
      slotMinutes: 60,
    })
    const slots = calculateAvailability(params)
    // Busy 12-13 with 30min buffer = 11:30-13:30
    // Free: 9-11:30, 13:30-17
    // 60-min slots: 9-10, 10-11 (11-11:30 not enough), 13:30-14:30 (not aligned)
    // Actually generateSlots steps from interval start:
    //   9:00-10:00, 10:00-11:00 (from 9-11:30, next 11:00+60min=12:00>11:30 so stops)
    //   13:30-14:30, 14:30-15:30, 15:30-16:30 (from 13:30-17)
    expect(slots).toHaveLength(5)

    // Verify no slot overlaps the buffered busy period
    for (const slot of slots) {
      const slotStart = new Date(slot.start).getTime()
      const slotEnd = new Date(slot.end).getTime()
      const bufferedBusyStart = t(12) - 30 * MIN
      const bufferedBusyEnd = t(13) + 30 * MIN
      const overlaps = slotStart < bufferedBusyEnd && slotEnd > bufferedBusyStart
      expect(overlaps).toBe(false)
    }
  })
})

// ---------- Slot duration variations ----------
describe('calculateAvailability - different slot durations', () => {
  it('should generate 30-minute slots correctly', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [interval(9, 11)],
      slotMinutes: 30,
    })
    const slots = calculateAvailability(params)
    expect(slots).toHaveLength(4) // 4 x 30min in 2 hours
  })

  it('should generate 15-minute slots correctly', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [interval(9, 10)],
      slotMinutes: 15,
    })
    const slots = calculateAvailability(params)
    expect(slots).toHaveLength(4) // 4 x 15min in 1 hour
  })

  it('should generate 120-minute slots correctly', () => {
    const params = makeParams({
      calendarBusyIntervals: new Map([['cal-a', []]]),
      availabilityWindows: [interval(9, 17)],
      slotMinutes: 120,
    })
    const slots = calculateAvailability(params)
    expect(slots).toHaveLength(4) // 4 x 2h in 8 hours
  })
})
