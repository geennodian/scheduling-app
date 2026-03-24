import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface CalendarInfo {
  id: string
  summary: string
  primary: boolean
  backgroundColor?: string
}

export async function listCalendars(authClient: OAuth2Client): Promise<CalendarInfo[]> {
  const calendar = google.calendar({ version: 'v3', auth: authClient })
  const res = await calendar.calendarList.list()
  return (res.data.items || []).map((item) => ({
    id: item.id || '',
    summary: item.summary || '',
    primary: item.primary || false,
    backgroundColor: item.backgroundColor || undefined,
  }))
}

export async function createCalendarEvent(
  authClient: OAuth2Client,
  calendarId: string,
  event: {
    summary: string
    description?: string
    start: Date
    end: Date
    timezone: string
    attendees?: { email: string }[]
  }
) {
  const calendar = google.calendar({ version: 'v3', auth: authClient })
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: event.timezone,
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: event.timezone,
      },
      attendees: event.attendees,
    },
  })
  return res.data
}
