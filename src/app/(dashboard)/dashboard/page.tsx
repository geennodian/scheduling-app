import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, CalendarDays, BookOpen } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id

  const [connectedAccountsCount, schedulingPagesCount, recentBookings, thisMonthBookingsCount] =
    await Promise.all([
      prisma.connectedGoogleAccount.count({ where: { userId } }),
      prisma.schedulingPage.count({ where: { userId } }),
      prisma.booking.findMany({
        where: {
          schedulingPage: { userId },
        },
        orderBy: { startAt: "desc" },
        take: 5,
        include: {
          schedulingPage: { select: { title: true } },
        },
      }),
      prisma.booking.count({
        where: {
          schedulingPage: { userId },
          startAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: "CONFIRMED",
        },
      }),
    ])

  const statusLabel = (status: string) =>
    status === "CONFIRMED" ? "確定" : "キャンセル"
  const statusVariant = (status: string): "default" | "destructive" =>
    status === "CONFIRMED" ? "default" : "destructive"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{session.user.name ?? "ユーザー"}さん
        </h1>
        <p className="text-gray-500 mt-1">日程調整アプリへようこそ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">接続アカウント数</CardTitle>
            <Link2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{connectedAccountsCount}</div>
            <p className="text-xs text-gray-500 mt-1">Googleアカウント</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">調整ページ数</CardTitle>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{schedulingPagesCount}</div>
            <p className="text-xs text-gray-500 mt-1">作成済みページ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今月の予約数</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{thisMonthBookingsCount}</div>
            <p className="text-xs text-gray-500 mt-1">確定済み予約</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近の予約</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">まだ予約はありません</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking: typeof recentBookings[number]) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">{booking.personName}</p>
                    <p className="text-xs text-gray-500">{booking.schedulingPage.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(booking.startAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={statusVariant(booking.status)}>
                    {statusLabel(booking.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
