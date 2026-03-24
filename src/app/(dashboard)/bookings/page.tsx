import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookOpen } from "lucide-react"
import { CancelBookingButton } from "@/components/dashboard/cancel-booking-button"

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const bookings = await prisma.booking.findMany({
    where: {
      schedulingPage: { userId: session.user.id },
    },
    include: {
      schedulingPage: { select: { title: true, timezone: true } },
    },
    orderBy: { startAt: "desc" },
  })

  const formatDateTime = (date: Date, timeZone?: string) =>
    new Date(date).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone || "Asia/Tokyo",
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">予約一覧</h1>
        <p className="text-gray-500 mt-1">全ての予約を管理します</p>
      </div>

      {bookings.length === 0 ? (
        <div className="border rounded-lg py-16 text-center bg-white">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">まだ予約はありません</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>調整ページ</TableHead>
                <TableHead>お名前</TableHead>
                <TableHead className="hidden md:table-cell">会社名</TableHead>
                <TableHead className="hidden md:table-cell">メールアドレス</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking: typeof bookings[number]) => (
                <TableRow key={booking.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(booking.startAt, booking.schedulingPage.timezone)}
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {booking.schedulingPage.title}
                  </TableCell>
                  <TableCell className="text-sm">{booking.personName}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-500">
                    {booking.companyName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-500">
                    {booking.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={booking.status === "CONFIRMED" ? "default" : "destructive"}
                    >
                      {booking.status === "CONFIRMED" ? "確定" : "キャンセル"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">詳細</Button>
                      </Link>
                      {booking.status === "CONFIRMED" && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
