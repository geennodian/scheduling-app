"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { PlusCircle, Trash2, Calendar } from "lucide-react"

type ConnectedCalendar = {
  id: string
  calendarId: string
  calendarName: string
  selectedForAvailability: boolean
}

type ConnectedAccount = {
  id: string
  googleEmail: string
  googleAccountId: string
  calendars: ConnectedCalendar[]
}

export function AccountsClient({ accounts }: { accounts: ConnectedAccount[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [connectingAccount, setConnectingAccount] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectedAccount | null>(null)
  const [togglingCalendar, setTogglingCalendar] = useState<string | null>(null)

  const handleAddAccount = async () => {
    setConnectingAccount(true)
    try {
      const res = await fetch("/api/google/connect")
      if (!res.ok) throw new Error("接続URLの取得に失敗しました")
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("URLが取得できませんでした")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
      setConnectingAccount(false)
    }
  }

  const handleDisconnect = async (account: ConnectedAccount) => {
    try {
      const res = await fetch("/api/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "切断に失敗しました")
      }
      toast.success(`${account.googleEmail} を切断しました`)
      setDisconnectTarget(null)
      startTransition(() => router.refresh())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    }
  }

  const handleToggleCalendar = async (calendarId: string, checked: boolean) => {
    setTogglingCalendar(calendarId)
    try {
      const res = await fetch("/api/google/calendars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId, selectedForAvailability: checked }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "更新に失敗しました")
      }
      startTransition(() => router.refresh())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setTogglingCalendar(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Googleアカウント連携</h1>
          <p className="text-gray-500 mt-1">接続したGoogleアカウントのカレンダーで空き時間を管理します</p>
        </div>
        <Button onClick={handleAddAccount} disabled={connectingAccount}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {connectingAccount ? "接続中..." : "Googleアカウントを追加"}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">まだGoogleアカウントが接続されていません</p>
            <p className="text-sm text-gray-400 mt-1">
              上のボタンからGoogleアカウントを追加してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{account.googleEmail}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {account.calendars.length} 件のカレンダー
                    </Badge>
                  </div>
                  <Dialog
                    open={disconnectTarget?.id === account.id}
                    onOpenChange={(open) => !open && setDisconnectTarget(null)}
                  >
                    <DialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDisconnectTarget(account)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          切断
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>アカウントの切断</DialogTitle>
                        <DialogDescription>
                          {account.googleEmail} を切断しますか？
                          このアカウントのカレンダーを使用している調整ページが影響を受ける可能性があります。
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDisconnectTarget(null)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDisconnect(account)}
                        >
                          切断する
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              {account.calendars.length > 0 && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      空き時間の計算に使用するカレンダー
                    </p>
                    <div className="space-y-2">
                      {account.calendars.map((cal) => (
                        <div key={cal.id} className="flex items-center justify-between py-1">
                          <Label
                            htmlFor={`cal-${cal.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {cal.calendarName}
                          </Label>
                          <Switch
                            id={`cal-${cal.id}`}
                            checked={cal.selectedForAvailability}
                            disabled={togglingCalendar === cal.id || isPending}
                            onCheckedChange={(checked) =>
                              handleToggleCalendar(cal.id, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
