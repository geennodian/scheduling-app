import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "使い方ガイド | 日程調整アプリ",
  description:
    "複数人のGoogleカレンダーから空き時間を自動算出。簡単に予約ページを作成できます。管理者・予約者それぞれの使い方を解説します。",
}

const faqItems = [
  {
    q: "カレンダーの予定内容は第三者に見られますか？",
    a: "いいえ。空き / 忙しいの情報のみを使用します。予定のタイトルや詳細が外部に公開されることはありません。",
  },
  {
    q: "何人まで連携できますか？",
    a: "制限はありません。必要なだけGoogleアカウントを追加してください。",
  },
  {
    q: "予約をキャンセルしたい場合は？",
    a: "予約確定時に届く確認メールにキャンセル用のリンクが記載されています。そちらからキャンセル操作が可能です。",
  },
  {
    q: "人格を設定しないとどうなりますか？",
    a: "カレンダー単位で空き時間を計算します。シンプルなケースではこれで十分ですが、1人が複数カレンダーを持つ場合は人格機能の利用を推奨します。",
  },
  {
    q: "バッファ時間とは何ですか？",
    a: "予約の前後に自動的に確保する余白時間です。15分バッファの場合、10:00〜11:00 の予約があると前後15分（9:45〜11:15）は他の予約を受け付けません。移動・準備時間の確保に便利です。",
  },
]

function StepCircle({ num }: { num: number }) {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
      {num}
    </div>
  )
}

function TipBanner({
  text,
  color,
}: {
  text: string
  color: "blue" | "green" | "indigo"
}) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    green: "bg-green-50 border-green-100 text-green-700",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
  }
  return (
    <div className={`px-5 py-3 border-t text-xs ${styles[color]}`}>{text}</div>
  )
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              日程調整アプリ
            </p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              複数人のGoogleカレンダーから空き時間を自動算出。簡単に予約ページを作成できます。
            </p>
          </div>
          <Link
            href="/login"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            ログインして始める
            <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-16">
        {/* Back link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span aria-hidden>←</span> トップに戻る
          </Link>
        </div>

        {/* Hero */}
        <section className="text-center py-6">
          <div className="text-5xl mb-5" aria-hidden>
            📅
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            日程調整アプリ 使い方ガイド
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            複数人のGoogleカレンダーから空き時間を自動算出。
            <br className="hidden sm:block" />
            簡単に予約ページを作成できます。
          </p>
        </section>

        {/* Section 1: できること */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-blue-500">
            1. このアプリでできること
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🗂️",
                title: "複数Googleアカウントのカレンダーを連携",
                desc: "複数のGoogleアカウントをまとめて管理・空き判定に活用できます。",
              },
              {
                icon: "⚡",
                title: "空き時間を自動算出",
                desc: "「全員共通」または「誰かが空いていれば可」の2方式で自動計算します。",
              },
              {
                icon: "🔗",
                title: "公開URLで予約ページを共有",
                desc: "URLを共有するだけで第三者が予約できます。相手側のアカウント登録不要です。",
              },
              {
                icon: "✅",
                title: "自動登録 & メール通知",
                desc: "予約確定時にGoogleカレンダーへ自動登録し、確認メールを送信します。",
              },
            ].map((feat) => (
              <Card key={feat.title} className="flex flex-row items-start gap-4 p-5">
                <span className="text-3xl flex-shrink-0 mt-0.5" aria-hidden>
                  {feat.icon}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    {feat.title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: 管理者の使い方 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2 pl-4 border-l-4 border-blue-500">
            2. 管理者の使い方（ステップバイステップ）
          </h2>
          <p className="text-sm text-gray-500 mb-6 pl-5">
            予約ページを作成・管理する側（主催者）の手順です。
          </p>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <StepCircle num={1} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">
                    ログイン
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    トップページの「ログイン」ボタンをクリックし、Googleアカウントでサインインします。ログイン後はダッシュボードにアクセスできます。
                  </p>
                </div>
              </div>
              <TipBanner
                text="Googleアカウントがあればすぐに始められます"
                color="blue"
              />
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <StepCircle num={2} />
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-1.5">
                    Googleアカウント連携
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    「Googleアカウント連携」ページで「Googleアカウントを追加」をクリックし、カレンダーを接続します。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 pl-3">
                    <li className="flex gap-2">
                      <span className="text-blue-400 mt-0.5" aria-hidden>
                        •
                      </span>
                      複数のGoogleアカウントを追加可能
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 mt-0.5" aria-hidden>
                        •
                      </span>
                      各アカウントで空き判定に使うカレンダーを選択
                    </li>
                  </ul>
                </div>
              </div>
              <TipBanner
                text="仕事用・個人用など複数アカウントをまとめて管理できます"
                color="indigo"
              />
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <StepCircle num={3} />
                <div className="w-full">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    調整ページ作成
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        label: "基本情報",
                        items: ["タイトル・説明を入力", "主催者名を設定"],
                      },
                      {
                        label: "調整方式を選択",
                        items: [
                          "全員共通空き枠：全カレンダーが空いている時間のみ",
                          "誰かが空いていれば可：少なくとも1人が空いている時間",
                        ],
                      },
                      {
                        label: "予約枠の設定",
                        items: [
                          "対象カレンダーを選択",
                          "時間帯・曜日を設定",
                          "枠の長さ（15 / 30 / 60分）を選択",
                          "バッファ（前後の余白）を設定",
                        ],
                      },
                      {
                        label: "公開設定",
                        items: [
                          "公開ONにする",
                          "公開URLをコピーして共有",
                        ],
                      },
                    ].map((group) => (
                      <div
                        key={group.label}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <p className="font-semibold text-gray-700 mb-1.5">
                          {group.label}
                        </p>
                        <ul className="space-y-1 text-gray-600">
                          {group.items.map((item) => (
                            <li key={item} className="flex gap-1.5">
                              <span className="text-gray-400 mt-0.5" aria-hidden>
                                •
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <TipBanner
                text="設定後すぐに公開URLが生成されます"
                color="green"
              />
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <StepCircle num={4} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">
                    予約管理
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    ダッシュボードの予約一覧から受け付けた予約を確認できます。必要に応じてキャンセル操作も可能です。
                  </p>
                </div>
              </div>
              <TipBanner
                text="予約確定時はGoogleカレンダーに自動登録 & メール通知が届きます"
                color="blue"
              />
            </div>
          </div>
        </section>

        {/* Section 3: 予約者の使い方 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2 pl-4 border-l-4 border-teal-500">
            3. 予約者の使い方
          </h2>
          <p className="text-sm text-gray-500 mb-6 pl-5">
            URLを受け取って予約する側の手順です。アカウント登録は不要です。
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 space-y-4">
              {[
                {
                  num: 1,
                  text: "共有されたURLにアクセスする",
                },
                {
                  num: 2,
                  text: "空いている日付を選択する",
                },
                {
                  num: 3,
                  text: "希望の時間枠を選択する",
                },
                {
                  num: 4,
                  text: "名前・メールアドレス等を入力する",
                },
                {
                  num: 5,
                  text: "予約を確定する → 確認メールが届く",
                },
              ].map((step, i, arr) => (
                <div key={step.num}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {step.num}
                    </div>
                    <p className="text-sm text-gray-700">{step.text}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="ml-4 mt-1 w-px h-3 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
            <div className="bg-teal-50 border-t border-teal-100 px-5 py-3 text-xs text-teal-700">
              アカウント登録・ログイン不要。URLを開くだけで予約できます。
            </div>
          </div>
        </section>

        {/* Section 4: 人格（CalendarGroup）機能 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2 pl-4 border-l-4 border-purple-500">
            4.「人格（CalendarGroup）」機能について
          </h2>
          <p className="text-sm text-gray-500 mb-6 pl-5">
            このアプリの核となる概念です。
          </p>

          <div className="space-y-5">
            {/* 概要 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span aria-hidden>🧑</span> 人格とは
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  複数のカレンダーを「1人の人格」としてグループ化する機能です。
                </p>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-purple-800">
                  <span className="font-semibold">例：</span>{" "}
                  Aさんの仕事カレンダー ＋ 個人カレンダー ＝「Aさん」という1つの人格
                </div>
                <ul className="text-sm text-gray-600 space-y-1.5 pl-1">
                  <li className="flex gap-2">
                    <span className="text-purple-400 mt-0.5" aria-hidden>•</span>
                    人格単位で空き判定ができる
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400 mt-0.5" aria-hidden>•</span>
                    1人が複数カレンダーを持っていても正確に空き時間を算出
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 具体例 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span aria-hidden>📊</span> 具体例
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* WITHOUT */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">人格なし</Badge>
                    <span className="text-xs text-gray-500">カレンダーごとに個別判定</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5">
                    <p>仕事カレンダー: 10:00〜12:00 会議</p>
                    <p>個人カレンダー: 14:00〜15:00 歯医者</p>
                    <Separator className="my-2 bg-red-200" />
                    <p className="text-red-700">
                      → 仕事カレンダーだけで判定すると 14:00〜15:00 が「空き」と誤判定
                    </p>
                  </div>
                </div>

                {/* WITH */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">人格あり</Badge>
                    <span className="text-xs text-gray-500">全カレンダーを統合して判定</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5">
                    <p>「Aさん」グループ ＝ 仕事カレンダー ＋ 個人カレンダー</p>
                    <p>→ 10:00〜12:00 と 14:00〜15:00 が両方「忙しい」と判定</p>
                    <Separator className="my-2 bg-green-200" />
                    <p className="text-green-700">
                      → 正確な空き: 9:00〜10:00、12:00〜14:00、15:00〜18:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 調整方式との組み合わせ */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                <span aria-hidden>💡</span> 人格 × 調整方式の組み合わせ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-indigo-700 mb-1">
                    全員共通空き枠モード（AND）
                  </p>
                  <p className="text-xs text-gray-600">
                    全人格が空いている時間のみ表示されます。
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-teal-700 mb-1">
                    誰かが空いていれば可モード（OR）
                  </p>
                  <p className="text-xs text-gray-600">
                    いずれかの人格が空いていれば表示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-orange-400">
            5. よくある質問
          </h2>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex gap-3 p-5">
                  <span className="flex-shrink-0 text-blue-600 font-bold text-base">
                    Q.
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-2">
                      {item.q}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="text-green-600 font-bold mr-1">A.</span>
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
            <div className="text-4xl mb-4" aria-hidden>
              🚀
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              さっそく使ってみよう
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Googleアカウントがあればすぐに始められます。
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base"
            >
              ログインして始める
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-4">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
          日程調整アプリ — Googleカレンダーと連携したスケジュール管理ツール
        </div>
      </footer>
    </div>
  )
}
