import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const bookings = await prisma.booking.findMany({
    where: {
      schedulingPage: { userId: session.user.id },
    },
    include: {
      schedulingPage: {
        select: { title: true, slug: true, timezone: true },
      },
    },
    orderBy: { startAt: 'desc' },
  })

  return NextResponse.json(bookings)
}
