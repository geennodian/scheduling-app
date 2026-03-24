import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  memberCalendarIds: z.array(z.string()).min(1).optional(),
  representativeCalendarId: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const group = await prisma.calendarGroup.findFirst({
    where: {
      id,
      schedulingPage: { userId: session.user.id },
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

  if (!group) {
    return NextResponse.json({ error: 'グループが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(group)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify ownership through scheduling page
  const existing = await prisma.calendarGroup.findFirst({
    where: {
      id,
      schedulingPage: { userId: session.user.id },
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'グループが見つかりません' }, { status: 404 })
  }

  const { name, memberCalendarIds, representativeCalendarId } = parsed.data

  // Update group and optionally recreate members
  const group = await prisma.$transaction(async (tx) => {
    // Update group name if provided
    if (name) {
      await tx.calendarGroup.update({
        where: { id },
        data: { name },
      })
    }

    // Recreate members if provided
    if (memberCalendarIds) {
      // Delete old members
      await tx.calendarGroupMember.deleteMany({
        where: { calendarGroupId: id },
      })

      // Create new members
      await tx.calendarGroupMember.createMany({
        data: memberCalendarIds.map((calId) => ({
          calendarGroupId: id,
          connectedCalendarId: calId,
          isRepresentative:
            calId === representativeCalendarId ||
            (representativeCalendarId === undefined && memberCalendarIds.indexOf(calId) === 0),
        })),
      })
    }

    // Return updated group with members
    return tx.calendarGroup.findUnique({
      where: { id },
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
  })

  return NextResponse.json(group)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  // Verify ownership through scheduling page
  const existing = await prisma.calendarGroup.findFirst({
    where: {
      id,
      schedulingPage: { userId: session.user.id },
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'グループが見つかりません' }, { status: 404 })
  }

  await prisma.calendarGroup.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
