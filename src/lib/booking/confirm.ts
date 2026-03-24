import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { CreateBookingInput } from '@/lib/validators/booking'
import { releaseLock } from './lock'
import { getAssignmentStrategy, getGroupAssignmentStrategy } from './assignment'

interface ConfirmBookingParams {
  schedulingPageId: string
  input: CreateBookingInput
  availableCalendarIds?: string[]
}

export async function confirmBooking(params: ConfirmBookingParams) {
  const { schedulingPageId, input, availableCalendarIds } = params

  const schedulingPage = await prisma.schedulingPage.findUnique({
    where: { id: schedulingPageId },
    include: {
      calendarTargets: true,
      bookingFormSetting: true,
    },
  })

  if (!schedulingPage) {
    throw new Error('調整ページが見つかりません')
  }

  // Check for conflicts (double booking)
  const conflict = await prisma.booking.findFirst({
    where: {
      schedulingPageId,
      status: 'CONFIRMED',
      OR: [
        {
          startAt: { lt: new Date(input.slotEnd) },
          endAt: { gt: new Date(input.slotStart) },
        },
      ],
    },
  })

  if (conflict) {
    throw new Error('この時間枠は既に予約されています')
  }

  // Check daily limit
  if (schedulingPage.dailyLimit) {
    const startOfDay = new Date(input.slotStart)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(input.slotStart)
    endOfDay.setHours(23, 59, 59, 999)

    const dayCount = await prisma.booking.count({
      where: {
        schedulingPageId,
        status: 'CONFIRMED',
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (dayCount >= schedulingPage.dailyLimit) {
      throw new Error('この日の予約上限に達しています')
    }
  }

  // Determine assigned calendar
  let assignedCalendarId: string | null = null
  if (schedulingPage.mode === 'ANY_FREE' && availableCalendarIds) {
    const strategy = getAssignmentStrategy()
    assignedCalendarId = strategy.assign(
      availableCalendarIds,
      schedulingPage.calendarTargets.map((t: { connectedCalendarId: string; priorityOrder: number }) => ({
        connectedCalendarId: t.connectedCalendarId,
        priorityOrder: t.priorityOrder,
      }))
    )
  } else if (schedulingPage.calendarTargets.length > 0) {
    // COMMON_FREE: use first target as representative
    const sorted = [...schedulingPage.calendarTargets].sort(
      (a, b) => a.priorityOrder - b.priorityOrder
    )
    assignedCalendarId = sorted[0].connectedCalendarId
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      schedulingPageId,
      assignedConnectedCalendarId: assignedCalendarId,
      startAt: new Date(input.slotStart),
      endAt: new Date(input.slotEnd),
      companyName: input.companyName,
      personName: input.personName,
      email: input.email,
      phone: input.phone,
      note: input.note,
      status: 'CONFIRMED',
      cancelToken: nanoid(32),
    },
    include: {
      schedulingPage: true,
      assignedConnectedCalendar: {
        include: {
          connectedGoogleAccount: true,
        },
      },
    },
  })

  // Release lock
  await releaseLock(schedulingPageId, input.slotStart)

  return booking
}

interface ConfirmGroupBookingParams {
  schedulingPageId: string
  input: CreateBookingInput
  availableGroupIds?: string[]
  allGroups: { groupId: string; priorityOrder: number; representativeCalendarId?: string }[]
}

export async function confirmGroupBooking(params: ConfirmGroupBookingParams) {
  const { schedulingPageId, input, availableGroupIds, allGroups } = params

  const schedulingPage = await prisma.schedulingPage.findUnique({
    where: { id: schedulingPageId },
    include: {
      calendarTargets: true,
      bookingFormSetting: true,
    },
  })

  if (!schedulingPage) {
    throw new Error('調整ページが見つかりません')
  }

  // Check for conflicts (double booking)
  const conflict = await prisma.booking.findFirst({
    where: {
      schedulingPageId,
      status: 'CONFIRMED',
      OR: [
        {
          startAt: { lt: new Date(input.slotEnd) },
          endAt: { gt: new Date(input.slotStart) },
        },
      ],
    },
  })

  if (conflict) {
    throw new Error('この時間枠は既に予約されています')
  }

  // Check daily limit
  if (schedulingPage.dailyLimit) {
    const startOfDay = new Date(input.slotStart)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(input.slotStart)
    endOfDay.setHours(23, 59, 59, 999)

    const dayCount = await prisma.booking.count({
      where: {
        schedulingPageId,
        status: 'CONFIRMED',
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (dayCount >= schedulingPage.dailyLimit) {
      throw new Error('この日の予約上限に達しています')
    }
  }

  // Determine assigned group and calendar
  let assignedCalendarId: string | null = null
  let assignedCalendarGroupId: string | null = null

  if (availableGroupIds && availableGroupIds.length > 0) {
    const strategy = getGroupAssignmentStrategy()
    const result = strategy.assign(availableGroupIds, allGroups)
    if (result) {
      assignedCalendarGroupId = result.groupId
      assignedCalendarId = result.calendarId
    }
  } else if (allGroups.length > 0) {
    // COMMON_FREE: use first group by priority as representative
    const sorted = [...allGroups].sort((a, b) => a.priorityOrder - b.priorityOrder)
    assignedCalendarGroupId = sorted[0].groupId
    assignedCalendarId = sorted[0].representativeCalendarId || null
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      schedulingPageId,
      assignedConnectedCalendarId: assignedCalendarId,
      assignedCalendarGroupId,
      startAt: new Date(input.slotStart),
      endAt: new Date(input.slotEnd),
      companyName: input.companyName,
      personName: input.personName,
      email: input.email,
      phone: input.phone,
      note: input.note,
      status: 'CONFIRMED',
      cancelToken: nanoid(32),
    },
    include: {
      schedulingPage: true,
      assignedConnectedCalendar: {
        include: {
          connectedGoogleAccount: true,
        },
      },
    },
  })

  // Release lock
  await releaseLock(schedulingPageId, input.slotStart)

  return booking
}
