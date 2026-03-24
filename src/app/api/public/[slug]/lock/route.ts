import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lockSlotSchema } from '@/lib/validators/booking'
import { acquireLock } from '@/lib/booking/lock'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const page = await prisma.schedulingPage.findUnique({
    where: { slug },
  })

  if (!page || !page.isPublished) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = lockSlotSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const locked = await acquireLock(page.id, parsed.data.slotStart)

  if (!locked) {
    return NextResponse.json(
      { error: 'この時間枠は現在他の方が予約手続き中です' },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true, expiresInSeconds: 300 })
}
