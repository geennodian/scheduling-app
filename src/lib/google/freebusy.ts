import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { TimeInterval } from '@/lib/availability/types'

export async function queryFreeBusy(
  authClient: OAuth2Client,
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date,
  timezone: string
): Promise<Map<string, TimeInterval[]>> {
  const calendar = google.calendar({ version: 'v3', auth: authClient })
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: timezone,
      items: calendarIds.map((id) => ({ id })),
    },
  })

  const result = new Map<string, TimeInterval[]>()
  const calendars = res.data.calendars || {}

  for (const calId of calendarIds) {
    const cal = calendars[calId]
    if (cal && cal.busy) {
      result.set(
        calId,
        cal.busy.map((b) => ({
          start: new Date(b.start!).getTime(),
          end: new Date(b.end!).getTime(),
        }))
      )
    } else {
      result.set(calId, [])
    }
  }

  return result
}
