"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface AvailableCalendar {
  id: string
  calendarId: string
  calendarName: string
  connectedGoogleAccount: { googleEmail: string }
}

interface CalendarGroupMember {
  id: string
  connectedCalendarId: string
  isRepresentative: boolean
  connectedCalendar: {
    id: string
    calendarId: string
    calendarName: string
    connectedGoogleAccount: { googleEmail: string }
  }
}

interface CalendarGroup {
  id: string
  name: string
  members: CalendarGroupMember[]
}

interface CalendarGroupsManagerProps {
  schedulingPageId: string
  availableCalendars: AvailableCalendar[]
}

interface GroupFormState {
  name: string
  selectedCalendarIds: string[]
  representativeCalendarId: string
}

const emptyForm = (): GroupFormState => ({
  name: "",
  selectedCalendarIds: [],
  representativeCalendarId: "",
})

export function CalendarGroupsManager({
  schedulingPageId,
  availableCalendars,
}: CalendarGroupsManagerProps) {
  const [groups, setGroups] = useState<CalendarGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState<GroupFormState>(emptyForm())
  const [savingNew, setSavingNew] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GroupFormState>(emptyForm())
  const [savingEdit, setSavingEdit] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/calendar-groups?schedulingPageId=${schedulingPageId}`
      )
      if (!res.ok) throw new Error("読み込みに失敗しました")
      const data = await res.json()
      setGroups(data)
    } catch {
      toast.error("人格の読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [schedulingPageId])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // ---- new form helpers ----

  const toggleNewCalendar = (calId: string) => {
    setNewForm((prev) => {
      const selected = prev.selectedCalendarIds.includes(calId)
        ? prev.selectedCalendarIds.filter((id) => id !== calId)
        : [...prev.selectedCalendarIds, calId]

      // If the representative is deselected, clear it
      const representativeCalendarId =
        prev.representativeCalendarId === calId && selected.includes(calId) === false
          ? ""
          : prev.representativeCalendarId

      return { ...prev, selectedCalendarIds: selected, representativeCalendarId }
    })
  }

  const handleCreateGroup = async () => {
    if (!newForm.name.trim()) {
      toast.error("人格名を入力してください")
      return
    }
    if (newForm.selectedCalendarIds.length === 0) {
      toast.error("カレンダーを1つ以上選択してください")
      return
    }
    if (!newForm.representativeCalendarId) {
      toast.error("代表カレンダーを選択してください")
      return
    }

    setSavingNew(true)
    try {
      const res = await fetch("/api/calendar-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedulingPageId,
          name: newForm.name.trim(),
          memberCalendarIds: newForm.selectedCalendarIds,
          representativeCalendarId: newForm.representativeCalendarId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "作成に失敗しました")
      }
      toast.success("人格を作成しました")
      setNewForm(emptyForm())
      setShowNewForm(false)
      await loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setSavingNew(false)
    }
  }

  // ---- edit helpers ----

  const startEdit = (group: CalendarGroup) => {
    const memberIds = group.members.map((m) => m.connectedCalendarId)
    const rep = group.members.find((m) => m.isRepresentative)
    setEditForm({
      name: group.name,
      selectedCalendarIds: memberIds,
      representativeCalendarId: rep?.connectedCalendarId ?? memberIds[0] ?? "",
    })
    setEditingId(group.id)
    setConfirmDeleteId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(emptyForm())
  }

  const toggleEditCalendar = (calId: string) => {
    setEditForm((prev) => {
      const selected = prev.selectedCalendarIds.includes(calId)
        ? prev.selectedCalendarIds.filter((id) => id !== calId)
        : [...prev.selectedCalendarIds, calId]

      const representativeCalendarId =
        prev.representativeCalendarId === calId && !selected.includes(calId)
          ? ""
          : prev.representativeCalendarId

      return { ...prev, selectedCalendarIds: selected, representativeCalendarId }
    })
  }

  const handleUpdateGroup = async (groupId: string) => {
    if (!editForm.name.trim()) {
      toast.error("人格名を入力してください")
      return
    }
    if (editForm.selectedCalendarIds.length === 0) {
      toast.error("カレンダーを1つ以上選択してください")
      return
    }
    if (!editForm.representativeCalendarId) {
      toast.error("代表カレンダーを選択してください")
      return
    }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/calendar-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          memberCalendarIds: editForm.selectedCalendarIds,
          representativeCalendarId: editForm.representativeCalendarId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "更新に失敗しました")
      }
      toast.success("人格を更新しました")
      cancelEdit()
      await loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setSavingEdit(false)
    }
  }

  // ---- delete helpers ----

  const handleDeleteGroup = async (groupId: string) => {
    setDeletingId(groupId)
    try {
      const res = await fetch(`/api/calendar-groups/${groupId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "削除に失敗しました")
      }
      toast.success("人格を削除しました")
      setConfirmDeleteId(null)
      await loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setDeletingId(null)
    }
  }

  // ---- render helpers ----

  const renderCalendarCheckboxList = (
    form: GroupFormState,
    toggleFn: (id: string) => void,
    setRepFn: (id: string) => void,
    idPrefix: string
  ) => (
    <div className="space-y-2">
      {availableCalendars.length === 0 ? (
        <p className="text-sm text-gray-500">
          連携済みカレンダーがありません
        </p>
      ) : (
        availableCalendars.map((cal) => {
          const isChecked = form.selectedCalendarIds.includes(cal.id)
          const isRep = form.representativeCalendarId === cal.id
          return (
            <div key={cal.id} className="flex items-start gap-3">
              <Checkbox
                id={`${idPrefix}-cal-${cal.id}`}
                checked={isChecked}
                onCheckedChange={() => toggleFn(cal.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`${idPrefix}-cal-${cal.id}`}
                  className="cursor-pointer leading-tight"
                >
                  <span className="font-medium">{cal.calendarName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {cal.connectedGoogleAccount.googleEmail}
                  </span>
                </Label>
                {isChecked && (
                  <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`${idPrefix}-representative`}
                      checked={isRep}
                      onChange={() => setRepFn(cal.id)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span className="text-xs text-gray-600">代表カレンダー</span>
                  </label>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">人格管理</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            複数のカレンダーをグループ化して人格として管理できます
          </p>
        </div>
        {!showNewForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowNewForm(true)
              setEditingId(null)
            }}
          >
            ＋ 人格を追加
          </Button>
        )}
      </div>

      {/* New group form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">新しい人格を作成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-group-name">
                人格名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-group-name"
                value={newForm.name}
                onChange={(e) =>
                  setNewForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例：山田 太郎"
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                メンバーカレンダー <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                チェックしたカレンダーの空き時間を統合します。代表カレンダーには予定が作成されます。
              </p>
              {renderCalendarCheckboxList(
                newForm,
                toggleNewCalendar,
                (id) =>
                  setNewForm((prev) => ({
                    ...prev,
                    representativeCalendarId: id,
                  })),
                "new"
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateGroup}
                disabled={savingNew}
              >
                {savingNew ? "保存中..." : "保存"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewForm(false)
                  setNewForm(emptyForm())
                }}
                disabled={savingNew}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing groups */}
      {loading ? (
        <p className="text-sm text-gray-500 py-2">読み込み中...</p>
      ) : groups.length === 0 && !showNewForm ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">人格がまだ作成されていません</p>
          <p className="text-xs text-gray-400 mt-1">
            「＋ 人格を追加」から作成してください
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isEditing = editingId === group.id
            const isConfirmingDelete = confirmDeleteId === group.id
            const isDeleting = deletingId === group.id
            const repMember = group.members.find((m) => m.isRepresentative)

            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{group.name}</CardTitle>
                      {!isEditing && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {group.members.map((member) => (
                            <Badge
                              key={member.id}
                              variant={
                                member.isRepresentative ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {member.connectedCalendar.calendarName}
                              {member.isRepresentative && (
                                <span className="ml-1 opacity-70">（代表）</span>
                              )}
                            </Badge>
                          ))}
                          {group.members.length === 0 && (
                            <span className="text-xs text-gray-400">
                              メンバーなし
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => startEdit(group)}
                        >
                          編集
                        </Button>
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleDeleteGroup(group.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "削除中..." : "本当に削除"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                            >
                              戻る
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDeleteId(group.id)}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {isEditing && (
                  <CardContent className="space-y-4 pt-0">
                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-group-name-${group.id}`}>
                        人格名 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`edit-group-name-${group.id}`}
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="例：山田 太郎"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>
                        メンバーカレンダー <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-gray-500">
                        チェックしたカレンダーの空き時間を統合します。代表カレンダーには予定が作成されます。
                      </p>
                      {renderCalendarCheckboxList(
                        editForm,
                        toggleEditCalendar,
                        (id) =>
                          setEditForm((prev) => ({
                            ...prev,
                            representativeCalendarId: id,
                          })),
                        `edit-${group.id}`
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUpdateGroup(group.id)}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "保存中..." : "保存"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={savingEdit}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
