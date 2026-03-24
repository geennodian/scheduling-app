import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Copy, CalendarDays } from "lucide-react"
import { CopyUrlButton } from "@/components/dashboard/copy-url-button"

export default async function SchedulingPagesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const pages = await prisma.schedulingPage.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const modeLabel = (mode: string) =>
    mode === "COMMON_FREE" ? "全員共通" : "誰か空き"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">調整ページ</h1>
          <p className="text-gray-500 mt-1">日程調整用の公開ページを管理します</p>
        </div>
        <Link href="/scheduling-pages/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">まだ調整ページがありません</p>
            <p className="text-sm text-gray-400 mt-1">
              上のボタンから最初のページを作成してください
            </p>
            <Link href="/scheduling-pages/new" className="mt-4 inline-block">
              <Button variant="outline">調整ページを作成</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page: typeof pages[number]) => (
            <Card key={page.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{page.title}</CardTitle>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={page.isPublished ? "default" : "secondary"}>
                      {page.isPublished ? "公開中" : "非公開"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {modeLabel(page.mode)}
                    </Badge>
                  </div>
                </div>
                {page.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {page.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <p className="text-sm text-gray-600">
                  予約数：<span className="font-semibold">{page._count.bookings}</span> 件
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  /{page.slug}
                </p>
              </CardContent>
              <CardFooter className="pt-0 gap-2">
                <Link href={`/scheduling-pages/${page.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    編集
                  </Button>
                </Link>
                <CopyUrlButton url={`${baseUrl}/book/${page.slug}`} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
