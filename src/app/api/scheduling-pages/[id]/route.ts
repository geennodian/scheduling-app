import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateSchedulingPageSchema } from '@/lib/validators/scheduling-page'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params

  const page = await prisma.schedulingPage.findFirst({
    where: { id, userId: session.user.id },
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
    },
  })

  if (!page) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(page)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = updateSchedulingPageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify ownership
  const existing = await prisma.schedulingPage.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  const { weekdayRules, timeRules, calendarTargetIds, bookingFormSetting, ...pageData } = parsed.data

  // Update in transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await prisma.$transaction(async (tx: any) => {
    // Update main page data
    await tx.schedulingPage.update({
      where: { id },
      data: pageData,
    })

    // Update weekday rules if provided
    if (weekdayRules) {
      await tx.schedulingPageWeekdayRule.deleteMany({ where: { schedulingPageId: id } })
      await tx.schedulingPageWeekdayRule.createMany({
        data: weekdayRules.map((r: { weekday: number; enabled: boolean }) => ({ ...r, schedulingPageId: id })),
      })
    }

    // Update time rules if provided
    if (timeRules) {
      await tx.schedulingPageTimeRule.deleteMany({ where: { schedulingPageId: id } })
      await tx.schedulingPageTimeRule.createMany({
        data: timeRules.map((r: { startTime: string; endTime: string }) => ({ ...r, schedulingPageId: id })),
      })
    }

    // Update calendar targets if provided
    if (calendarTargetIds) {
      await tx.schedulingPageCalendarTarget.deleteMany({ where: { schedulingPageId: id } })
      await tx.schedulingPageCalendarTarget.createMany({
        data: calendarTargetIds.map((calId: string, index: number) => ({
          schedulingPageId: id,
          connectedCalendarId: calId,
          priorityOrder: index,
        })),
      })
    }

    // Update booking form settings if provided
    if (bookingFormSetting) {
      await tx.bookingFormSetting.upsert({
        where: { schedulingPageId: id },
        update: bookingFormSetting,
        create: { ...bookingFormSetting, schedulingPageId: id },
      })
    }

    return tx.schedulingPage.findUnique({
      where: { id },
      include: {
        weekdayRules: true,
        timeRules: true,
        calendarTargets: true,
        bookingFormSetting: true,
      },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.schedulingPage.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  await prisma.schedulingPage.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
