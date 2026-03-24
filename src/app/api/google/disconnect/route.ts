import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { accountId } = await request.json()
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

  await prisma.connectedGoogleAccount.delete({ where: { id: accountId } })

  return NextResponse.json({ success: true })
}
