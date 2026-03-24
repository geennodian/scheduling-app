import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "使い方ガイド | 日程調整アプリ",
  description: "日程調整アプリの使い方を解説します。カレンダーグループ（人格）の概念や調整方式についても詳しく説明します。",
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">日程調整アプリ</h1>
            <p className="text-sm text-gray-500">使い方ガイド</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログインして始める →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center py-8">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            日程調整をもっとかんたんに
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            複数人のGoogleカレンダーを統合して空き時間を自動算出。
            公開URLを共有するだけで、すぐに予約を受け付けられます。
          </p>
        </section>

        {/* Section 1: できること */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-blue-500">
            このアプリでできること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex gap-4">
              <span className="text-3xl flex-shrink-0">🗓️</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">空き時間を自動算出</h3>
                <p className="text-sm text-gray-600">複数人のGoogleカレンダーから空き時間を自動で計算します</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex gap-4">
              <span className="text-3xl flex-shrink-0">🔗</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">公開URLで予約受け付け</h3>
                <p className="text-sm text-gray-600">第三者に公開URLを共有するだけで予約を受け付けられます</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex gap-4">
              <span className="text-3xl flex-shrink-0">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">カレンダーに自動登録</h3>
                <p className="text-sm text-gray-600">予約確定時にGoogleカレンダーへ自動で予定を作成します</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex gap-4">
              <span className="text-3xl flex-shrink-0">👥</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">複数アカウント対応</h3>
                <p className="text-sm text-gray-600">複数のGoogleアカウントを統合して管理できます</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 使い方ステップ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-blue-500">
            基本的な使い方
          </h2>
          <div className="space-y-6">

            {/* Step 1 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Googleアカウントでログイン</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    「Googleアカウントでログイン」ボタンをクリックしてログインします。
                    管理者としてダッシュボードにアクセスできるようになります。
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
                <p className="text-xs text-blue-700">💡 Googleアカウントがあればすぐに始められます</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Googleカレンダーを接続</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    「Googleアカウント連携」ページで「Googleアカウントを追加」をクリックします。
                    複数のGoogleアカウントを接続でき、各アカウントのカレンダーから空き時間を計算します。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <span className="font-medium">例：</span> 仕事用アカウント + 個人用アカウントの両方を接続
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">日程調整ページを作成</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    「調整ページ」→「新規作成」から、日程調整ページを作成します。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">基本情報</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• タイトル・説明文</li>
                        <li>• 主催者名</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">調整設定</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 調整方式（AND / OR）</li>
                        <li>• 表示期間（例：30日間）</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">予約枠の設定</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 枠の長さ（15/30/60分）</li>
                        <li>• 対応曜日・時間帯</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">詳細設定</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• バッファ時間（前後の余白）</li>
                        <li>• 公開／非公開</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">公開URLを共有</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    作成したページを「公開」に設定し、URLをコピーして相手に共有します。
                    URLにアクセスするだけで予約ページが表示され、アカウント登録は不要です。
                  </p>
                </div>
              </div>
              <div className="bg-green-50 px-6 py-3 border-t border-green-100">
                <p className="text-xs text-green-700">🔗 受け取った側はURLを開くだけ、アカウント不要です</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">予約を受け付ける</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    第三者がURLにアクセスして空き時間を選択し、名前・メールアドレス等を入力して予約を確定します。
                    予約が確定すると、Googleカレンダーに自動で予定が作成されます。
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
                <p className="text-xs text-blue-700">📧 予約確定時にメール通知とGoogleカレンダーへの自動登録が行われます</p>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: 調整方式 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-blue-500">
            調整方式について
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* AND モード */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg">共通空き枠モード（AND）</h3>
                <p className="text-indigo-200 text-sm mt-1">全員が空いている時間のみ表示</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="text-sm text-gray-700">AさんもBさんも空いている → 表示</span>
                  </div>
                  <div className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span className="text-sm text-gray-700">Aさんだけ空いている → 非表示</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">おすすめの使いどころ</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• チームミーティング</li>
                    <li>• 全員参加が必要な会議</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* OR モード */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-teal-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg">誰かが空いていれば可モード（OR）</h3>
                <p className="text-teal-200 text-sm mt-1">1人でも空いていれば表示</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="text-sm text-gray-700">Aさんだけ空いている → 表示</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="text-sm text-gray-700">Bさんだけ空いている → 表示</span>
                  </div>
                  <div className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span className="text-sm text-gray-700">全員埋まっている → 非表示</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">おすすめの使いどころ</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• カスタマーサポート</li>
                    <li>• 誰か1人が対応すればOKな場合</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 4: 人格（カレンダーグループ）*/}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 pl-4 border-l-4 border-blue-500">
            「人格」（カレンダーグループ）とは？
          </h2>
          <p className="text-gray-500 text-sm mb-6 pl-5">このアプリの核となる概念です</p>

          <div className="space-y-6">

            {/* 人格とは */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🧑</span> 人格とは
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                複数のカレンダーを「1人の人格」としてまとめる機能です。
                例えば田中さんが「個人カレンダー」と「仕事カレンダー」を持っている場合、
                両方を1つの「田中さん」グループにまとめることができます。
                グループ内の全カレンダーの予定を統合して、その人が本当に空いている時間を正確に算出します。
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <span className="font-medium">ポイント：</span>
                グループ内の全カレンダーの予定を統合して、その人が<strong>本当に空いている時間</strong>を正確に算出します。
              </div>
            </div>

            {/* なぜ必要 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🤔</span> なぜ必要？
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="text-gray-400 mt-0.5">▶</span>
                  Googleカレンダーでは1人が複数のカレンダーを使うことが多い
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 mt-0.5">▶</span>
                  カレンダーごとに空き判定すると、実際には忙しい時間も「空き」と判定されてしまう
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 mt-0.5">▶</span>
                  <span className="text-blue-700 font-medium">「人格」を使えば、1人の全予定を統合して正確な空き時間を計算できる</span>
                </li>
              </ul>
            </div>

            {/* 具体例 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span> 具体例（図解）
              </h3>

              <div className="space-y-4">
                {/* WITHOUT 人格 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 text-sm font-bold">❌</span>
                    <span className="text-sm font-semibold text-gray-700">人格なし（個別カレンダー判定）</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 font-mono text-xs text-gray-700 space-y-1">
                    <p>田中・仕事カレンダー:  10:00〜12:00 会議</p>
                    <p>田中・個人カレンダー:  14:00〜15:00 歯医者</p>
                    <div className="border-t border-red-200 mt-2 pt-2 text-red-700">
                      → カレンダーごとに別々に判定されてしまう<br />
                      → 仕事カレンダーで判定すると 14:00〜15:00 が「空き」扱いに
                    </div>
                  </div>
                </div>

                {/* WITH 人格 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-sm font-bold">✅</span>
                    <span className="text-sm font-semibold text-gray-700">人格あり（統合して判定）</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 font-mono text-xs text-gray-700 space-y-1">
                    <p>「田中さん」グループ ＝ 仕事カレンダー ＋ 個人カレンダー</p>
                    <p>→ 10:00〜12:00 と 14:00〜15:00 が両方とも「田中さんは忙しい」として扱われる</p>
                    <div className="border-t border-green-200 mt-2 pt-2 text-green-700">
                      → 正確な空き時間: 9:00〜10:00, 12:00〜14:00, 15:00〜18:00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 設定方法 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚙️</span> 人格の設定方法
              </h3>
              <ol className="space-y-3">
                {[
                  "日程調整ページを作成する",
                  "ページの編集画面を開く",
                  "「人格（カレンダーグループ）」セクションで「＋ 人格を追加」をクリック",
                  "人格名を入力する（例：「田中太郎」）",
                  "グループに含めるカレンダーを選択する",
                  "代表カレンダーを選択する（予約確定時にこのカレンダーに予定が作成されます）",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* 人格 × 調整方式 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span> 人格 × 調整方式の組み合わせ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-indigo-700 mb-1">共通空き枠（AND）モード</p>
                  <p className="text-xs text-gray-600">全人格が空いている時間のみ表示されます</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-teal-700 mb-1">誰かが空き（OR）モード</p>
                  <p className="text-xs text-gray-600">いずれかの人格が空いていれば表示されます</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 5: FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-4 border-l-4 border-blue-500">
            よくある質問
          </h2>
          <div className="space-y-4">

            {[
              {
                q: "人格を設定しないとどうなる？",
                a: "従来通り、カレンダー単位で空き時間を計算します。シンプルなケースではこれで十分です。",
              },
              {
                q: "1つのカレンダーを複数の人格に入れられる？",
                a: "はい、可能です。共有カレンダーなど、複数のグループで参照したい場合にご利用ください。",
              },
              {
                q: "予約が入ったら通知は来る？",
                a: "メール通知が届きます（Gmailの設定が必要です）。また、Googleカレンダーにも自動で予定が作成されます。",
              },
              {
                q: "同時に予約されたらどうなる？",
                a: "ロック機構があるため、先に予約手続きを始めた方が優先されます。後から予約しようとした方にはエラーが表示されます。",
              },
              {
                q: "バッファ時間とは？",
                a: "予約の前後に確保する余白時間です。例えば15分バッファに設定した場合、10:00〜11:00の予約があると、その前後15分（9:45〜11:15）は他の予約を受け付けません。移動時間や準備時間の確保に便利です。",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex gap-3 p-5">
                  <span className="flex-shrink-0 text-blue-600 font-bold text-lg">Q.</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
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

        {/* Footer CTA */}
        <section className="text-center py-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-10">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">さっそく使ってみよう</h2>
            <p className="text-gray-500 text-sm mb-6">
              Googleアカウントがあればすぐに始められます。無料でお使いいただけます。
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
            >
              ログインして始める →
            </Link>
          </div>
        </section>

      </main>

      {/* Page footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
          <p>日程調整アプリ — Googleカレンダーと連携したスケジュール管理ツール</p>
        </div>
      </footer>
    </div>
  )
}
