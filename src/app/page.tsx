import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md w-full px-4">
        <div className="text-5xl mb-4">📅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">日程調整アプリ</h1>
        <p className="text-gray-500 text-sm mb-8">
          Googleカレンダーと連携して、かんたんに日程調整ができます
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base"
          >
            ログイン
          </Link>
          <Link
            href="/guide"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors text-base"
          >
            使い方ガイド
          </Link>
        </div>
      </div>
    </div>
  )
}
