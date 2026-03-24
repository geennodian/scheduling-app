import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { SchedulingPageForm } from "@/components/dashboard/scheduling-page-form"

export default async function EditSchedulingPagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  const [page, calendars] = await Promise.all([
    prisma.schedulingPage.findUnique({
      where: { id, userId: session.user.id },
      include: {
        weekdayRules: true,
        timeRules: true,
        calendarTargets: true,
        bookingFormSetting: true,
      },
    }),
    prisma.connectedCalendar.findMany({
      where: {
        connectedGoogleAccount: { userId: session.user.id },
      },
      include: {
        connectedGoogleAccount: {
          select: { googleEmail: true },
        },
      },
      orderBy: [
        { connectedGoogleAccount: { googleEmail: "asc" } },
        { calendarName: "asc" },
      ],
    }),
  ])

  if (!page) {
    notFound()
  }

  const initialData = {
    title: page.title,
    description: page.description ?? "",
    organizerName: page.organizerName ?? "",
    mode: page.mode as "COMMON_FREE" | "ANY_FREE",
    timezone: page.timezone,
    dateRangeDays: page.dateRangeDays,
    slotMinutes: page.slotMinutes,
    bufferBeforeMinutes: page.bufferBeforeMinutes,
    bufferAfterMinutes: page.bufferAfterMinutes,
    dailyLimit: page.dailyLimit?.toString() ?? "",
    isPublished: page.isPublished,
    enabledWeekdays: page.weekdayRules
      .filter((r: { enabled: boolean }) => r.enabled)
      .map((r: { weekday: number }) => r.weekday),
    timeRules: page.timeRules.map((r: { id: string; startTime: string; endTime: string }) => ({
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
    calendarTargetIds: page.calendarTargets.map((t: { connectedCalendarId: string }) => t.connectedCalendarId),
    requireCompany: page.bookingFormSetting?.requireCompany ?? false,
    requirePhone: page.bookingFormSetting?.requirePhone ?? false,
    requireNote: page.bookingFormSetting?.requireNote ?? false,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">調整ページを編集</h1>
        <p className="text-gray-500 mt-1">{page.title}</p>
      </div>
      <SchedulingPageForm
        initialData={initialData}
        pageId={page.id}
        calendars={calendars}
      />
    </div>
  )
}
