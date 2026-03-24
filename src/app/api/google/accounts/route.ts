import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const accounts = await prisma.connectedGoogleAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      googleEmail: true,
      googleAccountId: true,
      createdAt: true,
      calendars: {
        select: {
          id: true,
          calendarId: true,
          calendarName: true,
          selectedForAvailability: true,
        },
      },
    },
  })

  return NextResponse.json(accounts)
}
