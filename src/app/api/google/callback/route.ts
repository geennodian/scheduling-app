import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createOAuth2Client } from '@/lib/google/client'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { listCalendars } from '@/lib/google/calendar'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/accounts?error=no_code', request.url))
  }

  try {
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const googleEmail = userInfo.data.email || ''
    const googleAccountId = userInfo.data.id || ''

    // Upsert connected account
    const connectedAccount = await prisma.connectedGoogleAccount.upsert({
      where: {
        userId_googleAccountId: {
          userId: session.user.id,
          googleAccountId,
        },
      },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || '',
        googleEmail,
      },
      create: {
        userId: session.user.id,
        googleEmail,
        googleAccountId,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || '',
      },
    })

    // Fetch and save calendars
    const calendars = await listCalendars(oauth2Client)
    for (const cal of calendars) {
      await prisma.connectedCalendar.upsert({
        where: {
          connectedGoogleAccountId_calendarId: {
            connectedGoogleAccountId: connectedAccount.id,
            calendarId: cal.id,
          },
        },
        update: {
          calendarName: cal.summary,
        },
        create: {
          connectedGoogleAccountId: connectedAccount.id,
          calendarId: cal.id,
          calendarName: cal.summary,
          selectedForAvailability: cal.primary,
        },
      })
    }

    return NextResponse.redirect(new URL('/accounts', request.url))
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/accounts?error=auth_failed', request.url))
  }
}
