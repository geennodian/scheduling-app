import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthenticatedClient } from '@/lib/google/client'
import { queryFreeBusy } from '@/lib/google/freebusy'
import { calculateGroupAvailability } from '@/lib/availability/calculator'
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

  // Build unified persona list from groups + ungrouped targets
  interface Persona {
    id: string           // group ID or "auto_" + calendarId
    name: string
    representativeCalendarId?: string
    calendars: { connectedCalendar: typeof page.calendarTargets[number]['connectedCalendar']; connectedGoogleAccount: typeof page.calendarTargets[number]['connectedCalendar']['connectedGoogleAccount'] }[]
  }

  const personas: Persona[] = []

  // 1. Add explicit CalendarGroups as personas
  const groupedCalendarIds = new Set<string>()
  for (const group of page.calendarGroups) {
    if (group.members.length === 0) continue
    const representative = group.members.find((m) => m.isRepresentative)
    personas.push({
      id: group.id,
      name: group.name,
      representativeCalendarId: representative?.connectedCalendarId,
      calendars: group.members.map((m) => ({
        connectedCalendar: m.connectedCalendar,
        connectedGoogleAccount: m.connectedCalendar.connectedGoogleAccount,
      })),
    })
    group.members.forEach((m) => groupedCalendarIds.add(m.connectedCalendarId))
  }

  // 2. Add ungrouped calendarTargets as auto-personas
  for (const target of page.calendarTargets) {
    if (groupedCalendarIds.has(target.connectedCalendarId)) continue
    const cal = target.connectedCalendar
    personas.push({
      id: `auto_${cal.id}`,
      name: cal.calendarName || cal.calendarId,
      representativeCalendarId: cal.id,
      calendars: [{
        connectedCalendar: cal,
        connectedGoogleAccount: cal.connectedGoogleAccount,
      }],
    })
  }

  console.log('[Availability] Personas:', personas.map((p) => p.name))

  let slots

  if (personas.length === 0) {
    return NextResponse.json({
      page: {
        title: page.title,
        description: page.description,
        organizerName: page.organizerName,
        timezone: page.timezone,
        slotMinutes: page.slotMinutes,
        mode: page.mode,
      },
      slots: [],
    })
  }

  // 3. Fetch busy intervals for each persona
  const groupBusyIntervals = new Map<string, Map<string, { start: number; end: number }[]>>()

  for (const persona of personas) {
    const calendarBusyMap = new Map<string, { start: number; end: number }[]>()
    for (const { connectedCalendar, connectedGoogleAccount } of persona.calendars) {
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
        calendarBusyMap.set(connectedCalendar.id, busyMap.get(connectedCalendar.calendarId) || [])
      } catch (error) {
        console.error(`Failed to get busy for ${connectedCalendar.calendarId}:`, error)
        calendarBusyMap.set(connectedCalendar.id, [])
      }
    }
    groupBusyIntervals.set(persona.id, calendarBusyMap)
  }

  // 4. Calculate using group availability (which unions within each persona)
  const groupInfo = personas.map((p) => ({
    groupId: p.id,
    groupName: p.name,
    representativeCalendarId: p.representativeCalendarId,
  }))

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
