import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')

  let booking

  if (token) {
    // Cancel by token (from email link)
    booking = await prisma.booking.findFirst({
      where: { id, cancelToken: token, status: 'CONFIRMED' },
    })
  } else {
    // Cancel by organizer
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    booking = await prisma.booking.findFirst({
      where: {
        id,
        status: 'CONFIRMED',
        schedulingPage: { userId: session.user.id },
      },
    })
  }

  if (!booking) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  // If called from browser (cancel link), redirect
  if (token) {
    return NextResponse.redirect(new URL('/?cancelled=true', request.url))
  }

  return NextResponse.json({ success: true })
}
