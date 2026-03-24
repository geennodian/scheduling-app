import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      schedulingPage: { userId: session.user.id },
    },
    include: {
      schedulingPage: {
        select: { title: true, slug: true, timezone: true, organizerName: true },
      },
      assignedConnectedCalendar: {
        select: { calendarName: true, calendarId: true },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  return NextResponse.json(booking)
}
