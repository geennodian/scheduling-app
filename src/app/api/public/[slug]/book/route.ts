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
    // Check if calendarGroups exist and have members
    const hasGroups =
      page.calendarGroups.length > 0 &&
      page.calendarGroups.some((g) => g.members.length > 0)

    let booking

    if (hasGroups) {
      // Group-based booking
      const allGroups = page.calendarGroups.map((g) => {
        const representative = g.members.find((m) => m.isRepresentative)
        return {
          groupId: g.id,
          priorityOrder: g.priorityOrder,
          representativeCalendarId: representative?.connectedCalendarId,
        }
      })

      booking = await confirmGroupBooking({
        schedulingPageId: page.id,
        input: parsed.data,
        availableGroupIds: parsed.data.availableGroupIds,
        allGroups,
      })
    } else {
      // Fall back to existing calendar-target-based logic
      booking = await confirmBooking({
        schedulingPageId: page.id,
        input: parsed.data,
        availableCalendarIds: parsed.data.availableCalendarIds,
      })
    }

    // Create Google Calendar event
    // Resolve the connected calendar and Google account.
    // booking.assignedConnectedCalendar comes from Prisma include, but when using
    // groups the assigned calendar may not always be populated via the booking include.
    // Fall back to looking it up from the page's calendarGroups or calendarTargets.
    let resolvedCalendar = booking.assignedConnectedCalendar
    if (!resolvedCalendar && booking.assignedConnectedCalendarId) {
      console.log('[Book] assignedConnectedCalendar not included in booking, fetching from DB for calendarId:', booking.assignedConnectedCalendarId)
      resolvedCalendar = await prisma.connectedCalendar.findUnique({
        where: { id: booking.assignedConnectedCalendarId },
        include: { connectedGoogleAccount: true },
      })
    }

    console.log('[Book] Booking ID:', booking.id)
    console.log('[Book] assignedConnectedCalendarId:', booking.assignedConnectedCalendarId, resolvedCalendar ? 'resolved' : 'null')
    console.log('[Book] hasGroups:', hasGroups, 'assignedCalendarGroupId:', (booking as Record<string, unknown>).assignedCalendarGroupId ?? 'N/A')

    if (resolvedCalendar) {
      try {
        const { connectedGoogleAccount } = resolvedCalendar
        const calendarId = resolvedCalendar.calendarId
        const now = new Date()
        const tokenExpiry = connectedGoogleAccount.expiryDate ? new Date(connectedGoogleAccount.expiryDate) : null
        const isTokenExpired = tokenExpiry ? tokenExpiry < now : false

        console.log('[Book] Creating calendar event on calendarId:', calendarId)
        console.log('[Book] Google account:', connectedGoogleAccount.googleEmail, '(id:', connectedGoogleAccount.id, ')')
        console.log('[Book] Token expiry:', connectedGoogleAccount.expiryDate, '| now:', now.toISOString(), '| expired:', isTokenExpired)
        console.log('[Book] Has refresh token:', !!connectedGoogleAccount.refreshToken)

        const authClient = createAuthenticatedClient(
          connectedGoogleAccount.accessToken,
          connectedGoogleAccount.refreshToken,
          connectedGoogleAccount.expiryDate,
          connectedGoogleAccount.id
        )

        const event = await createCalendarEvent(
          authClient,
          calendarId,
          {
            summary: `${page.title} - ${booking.personName}${booking.companyName ? ` (${booking.companyName})` : ''}`,
            description: `予約者: ${booking.personName}\nメール: ${booking.email}${booking.phone ? `\n電話: ${booking.phone}` : ''}${booking.note ? `\n備考: ${booking.note}` : ''}`,
            start: booking.startAt,
            end: booking.endAt,
            timezone: page.timezone,
            attendees: [{ email: booking.email }],
          }
        )

        console.log('[Book] Calendar event created successfully:', event.id, 'on calendar:', calendarId)
        // Save Google event ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { googleEventId: event.id },
        })
      } catch (error: unknown) {
        const errObj = error as { response?: { data?: unknown; status?: number; statusText?: string }; message?: string; code?: string | number; errors?: unknown[] }
        console.error('[Book] Failed to create calendar event for booking:', booking.id)
        console.error('[Book] Calendar target:', resolvedCalendar.calendarId, 'via account:', resolvedCalendar.connectedGoogleAccount.googleEmail)
        console.error('[Book] Error details:', JSON.stringify({
          message: errObj.message,
          code: errObj.code,
          status: errObj.response?.status,
          statusText: errObj.response?.statusText,
          responseData: errObj.response?.data,
          errors: errObj.errors,
          stack: error instanceof Error ? error.stack : undefined,
        }, null, 2))
      }
    } else {
      console.warn('[Book] No assignedConnectedCalendar resolved for booking:', booking.id)
      console.warn('[Book] assignedConnectedCalendarId was:', booking.assignedConnectedCalendarId)
      console.warn('[Book] Page has', page.calendarTargets.length, 'calendarTargets and', page.calendarGroups.length, 'calendarGroups')
    }

    // Send confirmation email to booker
    const startDate = booking.startAt.toLocaleDateString('ja-JP', { timeZone: page.timezone })
    const startTime = booking.startAt.toLocaleTimeString('ja-JP', { timeZone: page.timezone, hour: '2-digit', minute: '2-digit' })
    const endTime = booking.endAt.toLocaleTimeString('ja-JP', { timeZone: page.timezone, hour: '2-digit', minute: '2-digit' })
    const cancelUrl = booking.cancelToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/${booking.id}/cancel?token=${booking.cancelToken}`
      : undefined

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
