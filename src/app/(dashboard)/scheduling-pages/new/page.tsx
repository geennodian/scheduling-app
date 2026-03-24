import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SchedulingPageForm } from "@/components/dashboard/scheduling-page-form"

export default async function NewSchedulingPagePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const calendars = await prisma.connectedCalendar.findMany({
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
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">調整ページを作成</h1>
        <p className="text-gray-500 mt-1">新しい日程調整ページを作成します</p>
      </div>
      <SchedulingPageForm calendars={calendars} />
    </div>
  )
}
