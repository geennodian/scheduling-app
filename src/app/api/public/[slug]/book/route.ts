import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBookingSchema } from '@/lib/validators/booking'
import { confirmBooking } from '@/lib/booking/confirm'
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
    const booking = await confirmBooking({
      schedulingPageId: page.id,
      input: parsed.data,
    })

    // Create Google Calendar event
    if (booking.assignedConnectedCalendar) {
      try {
        const { connectedGoogleAccount } = booking.assignedConnectedCalendar
        const authClient = createAuthenticatedClient(
          connectedGoogleAccount.accessToken,
          connectedGoogleAccount.refreshToken,
          connectedGoogleAccount.expiryDate
        )

        const event = await createCalendarEvent(
          authClient,
          booking.assignedConnectedCalendar.calendarId,
          {
            summary: `${page.title} - ${booking.personName}${booking.companyName ? ` (${booking.companyName})` : ''}`,
            description: `予約者: ${booking.personName}\nメール: ${booking.email}${booking.phone ? `\n電話: ${booking.phone}` : ''}${booking.note ? `\n備考: ${booking.note}` : ''}`,
            start: booking.startAt,
            end: booking.endAt,
            timezone: page.timezone,
            attendees: [{ email: booking.email }],
          }
        )

        // Save Google event ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { googleEventId: event.id },
        })
      } catch (error) {
        console.error('Failed to create calendar event:', error)
        // Don't fail the booking if calendar event fails
      }
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
