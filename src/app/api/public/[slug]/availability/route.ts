import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthenticatedClient } from '@/lib/google/client'
import { queryFreeBusy } from '@/lib/google/freebusy'
import { calculateAvailability, calculateGroupAvailability } from '@/lib/availability/calculator'
import { generateAvailabilityWindows } from '@/lib/availability/window-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const page = await prisma.schedulingPage.findUnique({
    where: { slug },
    include: {
      weekdayRules: true,
      timeRules: true,
      calendarTargets: {
        include: {
          connectedCalendar: {
            include: { connectedGoogleAccount: true },
          },
        },
        orderBy: { priorityOrder: 'asc' },
      },
      calendarGroups: {
        include: {
          members: {
            include: {
              connectedCalendar: {
                include: { connectedGoogleAccount: true },
              },
            },
          },
        },
        orderBy: { priorityOrder: 'asc' },
      },
    },
  })

  if (!page || !page.isPublished) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  // Determine date range
  const now = new Date()
  const startDate = new Date(now)
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + page.dateRangeDays)

  // Generate availability windows
  const availabilityWindows = generateAvailabilityWindows({
    startDate,
    endDate,
    timezone: page.timezone,
    weekdayRules: page.weekdayRules.map((r: { weekday: number; enabled: boolean }) => ({
      weekday: r.weekday,
      enabled: r.enabled,
    })),
    timeRules: page.timeRules.map((r: { startTime: string; endTime: string }) => ({
      startTime: r.startTime,
      endTime: r.endTime,
    })),
  })

  // Get existing bookings
  const existingBookings = await prisma.booking.findMany({
    where: {
      schedulingPageId: page.id,
      status: 'CONFIRMED',
      startAt: { gte: startDate },
      endAt: { lte: endDate },
    },
    select: { startAt: true, endAt: true },
  })

  // Get active locks
  const activeLocks = await prisma.bookingLock.findMany({
    where: {
      schedulingPageId: page.id,
      expiresAt: { gt: now },
    },
  })

  const bookingIntervals = existingBookings.map((b: { startAt: Date; endAt: Date }) => ({
    start: b.startAt.getTime(),
    end: b.endAt.getTime(),
  }))

  const lockIntervals = activeLocks.map((l: { slotKey: string }) => {
    const slotStart = new Date(l.slotKey).getTime()
    return {
      start: slotStart,
      end: slotStart + page.slotMinutes * 60 * 1000,
    }
  })

  // Check if calendarGroups exist and have members
  const hasGroups =
    page.calendarGroups.length > 0 &&
    page.calendarGroups.some((g) => g.members.length > 0)

  let slots

  if (hasGroups) {
    // Group-based availability calculation
    const groupBusyIntervals = new Map<string, Map<string, { start: number; end: number }[]>>()

    for (const group of page.calendarGroups) {
      const calendarBusyMap = new Map<string, { start: number; end: number }[]>()

      for (const member of group.members) {
        const { connectedCalendar } = member
        const { connectedGoogleAccount } = connectedCalendar

        try {
          const authClient = createAuthenticatedClient(
            connectedGoogleAccount.accessToken,
            connectedGoogleAccount.refreshToken,
            connectedGoogleAccount.expiryDate,
            connectedGoogleAccount.id
          )

          const busyMap = await queryFreeBusy(
            authClient,
            [connectedCalendar.calendarId],
            startDate,
            endDate,
            page.timezone
          )

          const busyIntervals = busyMap.get(connectedCalendar.calendarId) || []
          calendarBusyMap.set(connectedCalendar.id, busyIntervals)
        } catch (error) {
          console.error(
            `Failed to get busy intervals for calendar ${connectedCalendar.id} in group ${group.id}:`,
            error
          )
          calendarBusyMap.set(connectedCalendar.id, [])
        }
      }

      groupBusyIntervals.set(group.id, calendarBusyMap)
    }

    const groupInfo = page.calendarGroups.map((g) => {
      const representative = g.members.find((m) => m.isRepresentative)
      return {
        groupId: g.id,
        groupName: g.name,
        representativeCalendarId: representative?.connectedCalendarId,
      }
    })

    slots = calculateGroupAvailability({
      groupBusyIntervals,
      groupInfo,
      availabilityWindows,
      mode: page.mode,
      slotMinutes: page.slotMinutes,
      bufferBeforeMinutes: page.bufferBeforeMinutes,
      bufferAfterMinutes: page.bufferAfterMinutes,
      existingBookings: bookingIntervals,
      existingLocks: lockIntervals,
    })
  } else {
    // Fall back to existing calendar-target-based logic
    const calendarBusyIntervals = new Map<string, { start: number; end: number }[]>()

    for (const target of page.calendarTargets) {
      const { connectedCalendar } = target
      const { connectedGoogleAccount } = connectedCalendar

      try {
        const authClient = createAuthenticatedClient(
          connectedGoogleAccount.accessToken,
          connectedGoogleAccount.refreshToken,
          connectedGoogleAccount.expiryDate,
          connectedGoogleAccount.id
        )

        const busyMap = await queryFreeBusy(
          authClient,
          [connectedCalendar.calendarId],
          startDate,
          endDate,
          page.timezone
        )

        const busyIntervals = busyMap.get(connectedCalendar.calendarId) || []
        calendarBusyIntervals.set(connectedCalendar.id, busyIntervals)
      } catch (error) {
        console.error(`Failed to get busy intervals for calendar ${connectedCalendar.id}:`, error)
        calendarBusyIntervals.set(connectedCalendar.id, [])
      }
    }

    slots = calculateAvailability({
      calendarBusyIntervals,
      availabilityWindows,
      mode: page.mode,
      slotMinutes: page.slotMinutes,
      bufferBeforeMinutes: page.bufferBeforeMinutes,
      bufferAfterMinutes: page.bufferAfterMinutes,
      existingBookings: bookingIntervals,
      existingLocks: lockIntervals,
    })
  }

  return NextResponse.json({
    page: {
      title: page.title,
      description: page.description,
      organizerName: page.organizerName,
      timezone: page.timezone,
      slotMinutes: page.slotMinutes,
      mode: page.mode,
    },
    slots,
  })
}
