import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft } from "lucide-react"
import { CancelBookingButton } from "@/components/dashboard/cancel-booking-button"

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      schedulingPage: { userId: session.user.id },
    },
    include: {
      schedulingPage: {
        select: { title: true, slug: true, timezone: true },
      },
      assignedConnectedCalendar: {
        select: { calendarName: true },
      },
    },
  })

  if (!booking) {
    notFound()
  }

  const formatDate = (date: Date, timezone: string) =>
    new Date(date).toLocaleString("ja-JP", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    })

  const duration = Math.round(
    (new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60000
  )

  const DetailRow = ({
    label,
    value,
  }: {
    label: string
    value?: string | null
  }) => {
    if (!value) return null
    return (
      <div className="grid grid-cols-3 gap-4 py-3">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 col-span-2 break-all">{value}</dd>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/bookings">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            予約一覧へ
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">予約詳細</h1>
          <p className="text-gray-500 mt-1">{booking.schedulingPage.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={booking.status === "CONFIRMED" ? "default" : "destructive"}
            className="text-sm"
          >
            {booking.status === "CONFIRMED" ? "確定" : "キャンセル済み"}
          </Badge>
          {booking.status === "CONFIRMED" && (
            <CancelBookingButton bookingId={booking.id} />
          )}
        </div>
      </div>

      {/* Date & time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">日時情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm font-medium text-gray-500">開始日時</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {formatDate(booking.startAt, booking.schedulingPage.timezone)}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm font-medium text-gray-500">終了日時</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {formatDate(booking.endAt, booking.schedulingPage.timezone)}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm font-medium text-gray-500">所要時間</dt>
              <dd className="text-sm text-gray-900 col-span-2">{duration}分</dd>
            </div>
            {booking.assignedConnectedCalendar && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">使用カレンダー</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {booking.assignedConnectedCalendar.calendarName}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Guest info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">予約者情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-100">
            <DetailRow label="お名前" value={booking.personName} />
            <DetailRow label="メールアドレス" value={booking.email} />
            <DetailRow label="会社名" value={booking.companyName} />
            <DetailRow label="電話番号" value={booking.phone} />
            <DetailRow label="備考" value={booking.note} />
          </dl>
        </CardContent>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm font-medium text-gray-500">予約ID</dt>
              <dd className="text-xs text-gray-500 col-span-2 font-mono">{booking.id}</dd>
            </div>
            {booking.googleEventId && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">GoogleイベントID</dt>
                <dd className="text-xs text-gray-500 col-span-2 font-mono">
                  {booking.googleEventId}
                </dd>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm font-medium text-gray-500">予約日時</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {new Date(booking.createdAt).toLocaleString("ja-JP")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
