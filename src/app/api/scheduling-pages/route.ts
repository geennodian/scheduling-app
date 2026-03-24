import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSchedulingPageSchema } from '@/lib/validators/scheduling-page'
import { nanoid } from 'nanoid'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const pages = await prisma.schedulingPage.findMany({
    where: { userId: session.user.id },
    include: {
      weekdayRules: true,
      timeRules: true,
      calendarTargets: {
        include: {
          connectedCalendar: {
            include: { connectedGoogleAccount: true },
          },
        },
      },
      bookingFormSetting: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(pages)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchedulingPageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { weekdayRules, timeRules, calendarTargetIds, bookingFormSetting, ...pageData } = parsed.data
  const slug = nanoid(10)

  const page = await prisma.schedulingPage.create({
    data: {
      ...pageData,
      userId: session.user.id,
      slug,
      weekdayRules: weekdayRules
        ? { createMany: { data: weekdayRules } }
        : {
            createMany: {
              data: [
                { weekday: 1, enabled: true },
                { weekday: 2, enabled: true },
                { weekday: 3, enabled: true },
                { weekday: 4, enabled: true },
                { weekday: 5, enabled: true },
                { weekday: 0, enabled: false },
                { weekday: 6, enabled: false },
              ],
            },
          },
      timeRules: timeRules
        ? { createMany: { data: timeRules } }
        : { createMany: { data: [{ startTime: '09:00', endTime: '18:00' }] } },
      calendarTargets: calendarTargetIds
        ? {
            createMany: {
              data: calendarTargetIds.map((id: string, index: number) => ({
                connectedCalendarId: id,
                priorityOrder: index,
              })),
            },
          }
        : undefined,
      bookingFormSetting: bookingFormSetting
        ? { create: bookingFormSetting }
        : {
            create: {
              requireCompany: false,
              requireName: true,
              requireEmail: true,
              requirePhone: false,
              requireNote: false,
            },
          },
    },
    include: {
      weekdayRules: true,
      timeRules: true,
      calendarTargets: true,
      bookingFormSetting: true,
    },
  })

  return NextResponse.json(page, { status: 201 })
}
