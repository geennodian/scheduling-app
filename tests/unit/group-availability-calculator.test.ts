import { describe, it, expect } from 'vitest'
import { calculateGroupAvailability } from '@/lib/availability/calculator'
import { TimeInterval } from '@/lib/availability/types'

// Helper: create timestamp at hour offset from base
const BASE = new Date('2099-01-15T00:00:00Z').getTime()
function t(hours: number): number {
  return BASE + hours * 60 * 60 * 1000
}

// Standard availability window: 9:00-18:00
const WINDOW: TimeInterval = { start: t(9), end: t(18) }

describe('calculateGroupAvailability', () => {
  describe('COMMON_FREE mode (全人格空き)', () => {
    it('should return slots where all groups are free', () => {
      // Group A: busy 10-11
      // Group B: busy 14-15
      // Common free: 9-10, 11-14, 15-18
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', [{ start: t(10), end: t(11) }]]]))
      groupBusyIntervals.set('groupB', new Map([['calB1', [{ start: t(14), end: t(15) }]]]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [
          { groupId: 'groupA', groupName: 'Person A' },
          { groupId: 'groupB', groupName: 'Person B' },
        ],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      // Should have: 9-10, 11-12, 12-13, 13-14, 15-16, 16-17, 17-18 = 7 slots
      expect(slots.length).toBe(7)
      expect(slots.every(s => s.availableGroupIds?.length === 2)).toBe(true)
    })

    it('should return empty when no common time exists', () => {
      // Group A: busy 9-18 (entire window)
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', [{ start: t(9), end: t(18) }]]]))
      groupBusyIntervals.set('groupB', new Map([['calB1', []]]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [
          { groupId: 'groupA', groupName: 'Person A' },
          { groupId: 'groupB', groupName: 'Person B' },
        ],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      expect(slots.length).toBe(0)
    })
  })

  describe('ANY_FREE mode (誰かが空き)', () => {
    it('should return slots where at least one group is free', () => {
      // Group A: busy 10-14
      // Group B: busy 12-16
      // Union free: 9-10 (A only), 10-12 (B only), 14-16 (A only), 16-18 (both)
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', [{ start: t(10), end: t(14) }]]]))
      groupBusyIntervals.set('groupB', new Map([['calB1', [{ start: t(12), end: t(16) }]]]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [
          { groupId: 'groupA', groupName: 'Person A' },
          { groupId: 'groupB', groupName: 'Person B' },
        ],
        availabilityWindows: [WINDOW],
        mode: 'ANY_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      // 9-10 (A), 10-11 (B), 11-12 (B), 14-15 (A), 15-16 (A), 16-17 (A+B), 17-18 (A+B) = 7 slots
      expect(slots.length).toBe(7)

      // Check that some slots have only one group
      const singleGroupSlots = slots.filter(s => s.availableGroupIds?.length === 1)
      expect(singleGroupSlots.length).toBeGreaterThan(0)

      // Check that some slots have both groups
      const bothGroupSlots = slots.filter(s => s.availableGroupIds?.length === 2)
      expect(bothGroupSlots.length).toBeGreaterThan(0)
    })

    it('should return no slots when all groups are fully busy', () => {
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', [{ start: t(9), end: t(18) }]]]))
      groupBusyIntervals.set('groupB', new Map([['calB1', [{ start: t(9), end: t(18) }]]]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [
          { groupId: 'groupA', groupName: 'A' },
          { groupId: 'groupB', groupName: 'B' },
        ],
        availabilityWindows: [WINDOW],
        mode: 'ANY_FREE',
        slotMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      expect(slots.length).toBe(0)
    })
  })

  describe('Group busy = union of member calendars', () => {
    it('should union multiple calendars within a group', () => {
      // Group A has 2 calendars:
      //   calA1: busy 10-11
      //   calA2: busy 13-14
      // Group A overall busy: 10-11, 13-14
      // Group A free: 9-10, 11-13, 14-18
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([
        ['calA1', [{ start: t(10), end: t(11) }]],
        ['calA2', [{ start: t(13), end: t(14) }]],
      ]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'Person A' }],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      // Free: 9-10, 11-12, 12-13, 14-15, 15-16, 16-17, 17-18 = 7 slots
      expect(slots.length).toBe(7)
    })

    it('should union overlapping busy intervals within a group', () => {
      // Group A:
      //   calA1: busy 10-13
      //   calA2: busy 12-15
      // Union busy: 10-15
      // Free: 9-10, 15-18
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([
        ['calA1', [{ start: t(10), end: t(13) }]],
        ['calA2', [{ start: t(12), end: t(15) }]],
      ]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'Person A' }],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      // Free: 9-10, 15-16, 16-17, 17-18 = 4 slots
      expect(slots.length).toBe(4)
    })
  })

  describe('Buffer and existing bookings', () => {
    it('should apply buffer to group busy intervals', () => {
      // Group A: busy 12-13, buffer 30min each side → effective 11:30-13:30
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([
        ['calA1', [{ start: t(12), end: t(13) }]],
      ]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'A' }],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 30,
        bufferBeforeMinutes: 30,
        bufferAfterMinutes: 30,
        existingBookings: [],
        existingLocks: [],
      })

      // Busy 12-13 with 30min buffer = effective busy 11:30-13:30
      // So no slot should start at 11:30, 12:00, 12:30, 13:00
      const slotStarts = slots.map(s => new Date(s.start).getTime())
      expect(slotStarts).not.toContain(t(11.5))
      expect(slotStarts).not.toContain(t(12))
      expect(slotStarts).not.toContain(t(12.5))
      expect(slotStarts).not.toContain(t(13))
    })

    it('should filter out existing bookings', () => {
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', []]]))

      const slots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'A' }],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [{ start: t(10), end: t(11) }],
        existingLocks: [],
      })

      const slotStarts = slots.map(s => new Date(s.start).getTime())
      expect(slotStarts).not.toContain(t(10))
    })
  })

  describe('Edge cases', () => {
    it('should return empty for no groups', () => {
      const slots = calculateGroupAvailability({
        groupBusyIntervals: new Map(),
        groupInfo: [],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      expect(slots.length).toBe(0)
    })

    it('should handle single group same as single calendar', () => {
      const groupBusyIntervals = new Map<string, Map<string, TimeInterval[]>>()
      groupBusyIntervals.set('groupA', new Map([['calA1', [{ start: t(10), end: t(11) }]]]))

      const commonSlots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'A' }],
        availabilityWindows: [WINDOW],
        mode: 'COMMON_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      const anySlots = calculateGroupAvailability({
        groupBusyIntervals,
        groupInfo: [{ groupId: 'groupA', groupName: 'A' }],
        availabilityWindows: [WINDOW],
        mode: 'ANY_FREE',
        slotMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        existingBookings: [],
        existingLocks: [],
      })

      // Single group: COMMON_FREE and ANY_FREE should produce same slot count
      expect(commonSlots.length).toBe(anySlots.length)
    })
  })
})
