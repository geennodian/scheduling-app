"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Link2,
  CalendarDays,
  BookOpen,
  Menu,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/accounts", label: "Googleアカウント連携", icon: Link2 },
  { href: "/scheduling-pages", label: "調整ページ", icon: CalendarDays },
  { href: "/bookings", label: "予約一覧", icon: BookOpen },
]

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${active
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SignOutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" />
      ログアウト
    </Button>
  )
}

function SidebarContent({ user, pathname }: { user: User; pathname: string }) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U"

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-lg font-bold text-gray-900">日程調整アプリ</h1>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-4">
        <NavLinks pathname={pathname} />
      </div>
      <Separator />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  )
}

export function DashboardNav({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile header + content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent user={user} pathname={pathname} />
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-semibold text-gray-900">日程調整アプリ</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
