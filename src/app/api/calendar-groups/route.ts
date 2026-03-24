import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  schedulingPageId: z.string(),
  name: z.string().min(1).max(100),
  memberCalendarIds: z.array(z.string()).min(1),
  representativeCalendarId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const schedulingPageId = request.nextUrl.searchParams.get('schedulingPageId')

  const groups = await prisma.calendarGroup.findMany({
    where: {
      schedulingPage: { userId: session.user.id },
      ...(schedulingPageId ? { schedulingPageId } : {}),
    },
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
  })

  return NextResponse.json(groups)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { schedulingPageId, name, memberCalendarIds, representativeCalendarId } = parsed.data

  // Verify ownership of the scheduling page
  const page = await prisma.schedulingPage.findFirst({
    where: { id: schedulingPageId, userId: session.user.id },
  })
  if (!page) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  // Get current max priority order
  const maxOrder = await prisma.calendarGroup.aggregate({
    where: { schedulingPageId },
    _max: { priorityOrder: true },
  })

  const group = await prisma.calendarGroup.create({
    data: {
      name,
      schedulingPageId,
      priorityOrder: (maxOrder._max.priorityOrder ?? -1) + 1,
      members: {
        createMany: {
          data: memberCalendarIds.map((calId) => ({
            connectedCalendarId: calId,
            isRepresentative:
              calId === representativeCalendarId ||
              (representativeCalendarId === undefined && memberCalendarIds.indexOf(calId) === 0),
          })),
        },
      },
    },
    include: {
      members: {
        include: {
          connectedCalendar: {
            include: { connectedGoogleAccount: true },
          },
        },
      },
    },
  })

  return NextResponse.json(group, { status: 201 })
}
