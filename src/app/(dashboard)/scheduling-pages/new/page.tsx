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
      <div className="max-w-2xl rounded-xl border border-dashed border-gray-300 px-4 py-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">人格の設定</span>はページ作成後に行えます。
          作成後、編集画面から人格（カレンダーグループ）を追加してください。
        </p>
      </div>
    </div>
  )
}
