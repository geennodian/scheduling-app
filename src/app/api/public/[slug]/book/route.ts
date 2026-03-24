import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBookingSchema } from '@/lib/validators/booking'
import { confirmBooking, confirmGroupBooking } from '@/lib/booking/confirm'
import { createAuthenticatedClient } from '@/lib/google/client'
import { createCalendarEvent } from '@/lib/google/calendar'
import { sendEmail } from '@/lib/mail/sender'
import { bookingConfirmationEmail, bookingNotificationEmail } from '@/lib/mail/templates'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const page = await prisma.schedulingPage.findUnique({
    where: { slug },
    include: {
      user: true,
      calendarTargets: {
        include: {
          connectedCalendar: {
            include: { connectedGoogleAccount: true },
          },
        },
      },
      calendarGroups: {
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
      },
    },
  })

  if (!page || !page.isPublished) {
    return NextResponse.json({ error: 'ページが見つかりません' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = createBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // Build unified persona list (same logic as availability route)
    const groupedCalendarIds = new Set<string>()
    const allGroups: { groupId: string; priorityOrder: number; representativeCalendarId?: string }[] = []

    for (const group of page.calendarGroups) {
      if (group.members.length === 0) continue
      const representative = group.members.find((m) => m.isRepresentative)
      allGroups.push({
        groupId: group.id,
        priorityOrder: group.priorityOrder,
        representativeCalendarId: representative?.connectedCalendarId,
      })
      group.members.forEach((m) => groupedCalendarIds.add(m.connectedCalendarId))
    }

    // Add ungrouped calendarTargets as auto-personas
    let autoPersonaIndex = 0
    for (const target of page.calendarTargets) {
      if (groupedCalendarIds.has(target.connectedCalendarId)) continue
      const cal = target.connectedCalendar
      allGroups.push({
        groupId: `auto_${cal.id}`,
        priorityOrder: 1000 + autoPersonaIndex, // auto-personas have lower priority than explicit groups
        representativeCalendarId: cal.id,
      })
      autoPersonaIndex++
    }

    console.log('[Book] Personas:', allGroups.map((g) => g.groupId))

    let booking

    if (allGroups.length > 0) {
      // Use group booking for all personas (both explicit groups and auto-personas)
      booking = await confirmGroupBooking({
        schedulingPageId: page.id,
        input: parsed.data,
        availableGroupIds: parsed.data.availableGroupIds,
        allGroups,
      })
    } else {
      // No groups and no targets - fall back to basic booking
      booking = await confirmBooking({
        schedulingPageId: page.id,
        input: parsed.data,
        availableCalendarIds: parsed.data.availableCalendarIds,
      })
    }

    // --- Google Calendar event creation ---
    // COMMON_FREE: create event on ALL personas' representative calendars (everyone participates)
    // ANY_FREE: create event only on the assigned persona's representative calendar
    console.log('[Book] Booking ID:', booking.id, '| Mode:', page.mode, '| Personas:', allGroups.length)

    // Collect all representative calendars to create events on
    const calendarsToCreateEvent: { calendarId: string; connectedGoogleAccount: { id: string; googleEmail: string; accessToken: string; refreshToken: string; expiryDate: Date | null } }[] = []

    if (page.mode === 'COMMON_FREE') {
      // COMMON_FREE: all personas participate, so add event to ALL representative calendars
      for (const persona of allGroups) {
        if (!persona.representativeCalendarId) continue
        const cal = await prisma.connectedCalendar.findUnique({
          where: { id: persona.representativeCalendarId },
          include: { connectedGoogleAccount: true },
        })
        if (cal) {
          calendarsToCreateEvent.push({
            calendarId: cal.calendarId,
            connectedGoogleAccount: cal.connectedGoogleAccount,
          })
        }
      }
    } else {
      // ANY_FREE: only the assigned persona's calendar
      let resolvedCalendar = booking.assignedConnectedCalendar
      if (!resolvedCalendar && booking.assignedConnectedCalendarId) {
        resolvedCalendar = await prisma.connectedCalendar.findUnique({
          where: { id: booking.assignedConnectedCalendarId },
          include: { connectedGoogleAccount: true },
        })
      }
      if (resolvedCalendar) {
        calendarsToCreateEvent.push({
          calendarId: resolvedCalendar.calendarId,
          connectedGoogleAccount: resolvedCalendar.connectedGoogleAccount,
        })
      }
    }

    console.log('[Book] Creating events on', calendarsToCreateEvent.length, 'calendars:', calendarsToCreateEvent.map(c => c.calendarId))

    const createdEventIds: string[] = []
    for (const target of calendarsToCreateEvent) {
      try {
        const { connectedGoogleAccount } = target
        console.log('[Book] Creating event on:', target.calendarId, 'via', connectedGoogleAccount.googleEmail)

        const authClient = createAuthenticatedClient(
          connectedGoogleAccount.accessToken,
          connectedGoogleAccount.refreshToken,
          connectedGoogleAccount.expiryDate,
          connectedGoogleAccount.id
        )

        const event = await createCalendarEvent(authClient, target.calendarId, {
          summary: `${page.title} - ${booking.personName}${booking.companyName ? ` (${booking.companyName})` : ''}`,
          description: `予約者: ${booking.personName}\nメール: ${booking.email}${booking.phone ? `\n電話: ${booking.phone}` : ''}${booking.note ? `\n備考: ${booking.note}` : ''}`,
          start: booking.startAt,
          end: booking.endAt,
          timezone: page.timezone,
          attendees: [{ email: booking.email }],
        })

        console.log('[Book] Event created:', event.id, 'on', target.calendarId)
        if (event.id) createdEventIds.push(event.id)
      } catch (error: unknown) {
        const errObj = error as { response?: { data?: unknown; status?: number }; message?: string }
        console.error('[Book] Failed to create event on', target.calendarId, ':', errObj.message)
        if (errObj.response) console.error('[Book] Status:', errObj.response.status, JSON.stringify(errObj.response.data))
      }
    }

    // Save first event ID to booking record
    if (createdEventIds.length > 0) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId: createdEventIds.join(',') },
      })
    }

    // --- Email notifications ---
    const startDate = booking.startAt.toLocaleDateString('ja-JP', { timeZone: page.timezone })
    const startTime = booking.startAt.toLocaleTimeString('ja-JP', { timeZone: page.timezone, hour: '2-digit', minute: '2-digit' })
    const endTime = booking.endAt.toLocaleTimeString('ja-JP', { timeZone: page.timezone, hour: '2-digit', minute: '2-digit' })
    const cancelUrl = booking.cancelToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/${booking.id}/cancel?token=${booking.cancelToken}`
      : undefined

    // Send confirmation email to booker
    await sendEmail({
      to: booking.email,
      subject: `【予約確定】${page.title}`,
      html: bookingConfirmationEmail({
        personName: booking.personName,
        companyName: booking.companyName || undefined,
        date: startDate,
        startTime,
        endTime,
        timezone: page.timezone,
        pageTitle: page.title,
        organizerName: page.organizerName || undefined,
        note: booking.note || undefined,
        cancelUrl,
      }),
    })

    // Send notification email to organizer
    if (page.user.email) {
      await sendEmail({
        to: page.user.email,
        subject: `【新規予約】${page.title} - ${booking.personName}`,
        html: bookingNotificationEmail({
          personName: booking.personName,
          companyName: booking.companyName || undefined,
          email: booking.email,
          phone: booking.phone || undefined,
          date: startDate,
          startTime,
          endTime,
          timezone: page.timezone,
          pageTitle: page.title,
          note: booking.note || undefined,
        }),
      })
    }

    // COMMON_FREE: also notify all persona representative emails (participants)
    if (page.mode === 'COMMON_FREE') {
      const notifiedEmails = new Set<string>([booking.email, page.user.email || ''])
      for (const target of calendarsToCreateEvent) {
        const representativeEmail = target.calendarId // calendar ID is often the email
        if (notifiedEmails.has(representativeEmail)) continue
        notifiedEmails.add(representativeEmail)
        await sendEmail({
          to: representativeEmail,
          subject: `【新規予約】${page.title} - ${booking.personName}`,
          html: bookingNotificationEmail({
            personName: booking.personName,
            companyName: booking.companyName || undefined,
            email: booking.email,
            phone: booking.phone || undefined,
            date: startDate,
            startTime,
            endTime,
            timezone: page.timezone,
            pageTitle: page.title,
            note: booking.note || undefined,
          }),
        })
        console.log('[Book] Notification sent to participant:', representativeEmail)
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        personName: booking.personName,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '予約に失敗しました'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
