import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
  }

  // Verify ownership
  const account = await prisma.connectedGoogleAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  })

  if (!account) {
    return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })
  }

  const calendars = await prisma.connectedCalendar.findMany({
    where: { connectedGoogleAccountId: accountId },
  })

  return NextResponse.json(calendars)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { calendarId, selectedForAvailability } = await request.json()

  const calendar = await prisma.connectedCalendar.findUnique({
    where: { id: calendarId },
    include: { connectedGoogleAccount: true },
  })

  if (!calendar || calendar.connectedGoogleAccount.userId !== session.user.id) {
    return NextResponse.json({ error: 'カレンダーが見つかりません' }, { status: 404 })
  }

  const updated = await prisma.connectedCalendar.update({
    where: { id: calendarId },
    data: { selectedForAvailability },
  })

  return NextResponse.json(updated)
}
