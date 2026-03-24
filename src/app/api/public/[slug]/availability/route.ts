import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthenticatedClient } from '@/lib/google/client'
import { queryFreeBusy } from '@/lib/google/freebusy'
import { calculateAvailability } from '@/lib/availability/calculator'
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

  // Get busy intervals from Google Calendar
  const calendarBusyIntervals = new Map<string, { start: number; end: number }[]>()

  for (const target of page.calendarTargets) {
    const { connectedCalendar } = target
    const { connectedGoogleAccount } = connectedCalendar

    try {
      const authClient = createAuthenticatedClient(
        connectedGoogleAccount.accessToken,
        connectedGoogleAccount.refreshToken,
        connectedGoogleAccount.expiryDate
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
      // Skip this calendar if API fails
      calendarBusyIntervals.set(connectedCalendar.id, [])
    }
  }

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

  // Calculate availability
  const slots = calculateAvailability({
    calendarBusyIntervals,
    availabilityWindows,
    mode: page.mode,
    slotMinutes: page.slotMinutes,
    bufferBeforeMinutes: page.bufferBeforeMinutes,
    bufferAfterMinutes: page.bufferAfterMinutes,
    existingBookings: existingBookings.map((b: { startAt: Date; endAt: Date }) => ({
      start: b.startAt.getTime(),
      end: b.endAt.getTime(),
    })),
    existingLocks: activeLocks.map((l: { slotKey: string }) => {
      const slotStart = new Date(l.slotKey).getTime()
      return {
        start: slotStart,
        end: slotStart + page.slotMinutes * 60 * 1000,
      }
    }),
  })

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
