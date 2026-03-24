# 日程調整アプリ

## 概要

複数人のGoogleカレンダー予定を横断して空き時間を算出し、第三者が予約できるWebアプリ。

オーガナイザーが複数のGoogleアカウントを連携し、対象カレンダーと空き時間ルールを設定すると、公開予約ページが生成されます。予約者はそのページから空きスロットを選択し、必要情報を入力するだけで予約が完了します。予約確定時にはGoogleカレンダーへの予定作成とメール通知が自動で行われます。

## 主な機能

- **複数Googleアカウント連携** - ログインアカウントとは別に複数のGoogleアカウントのカレンダーを接続可能
- **共通空き枠モード（AND）** - 全対象カレンダーが空いている時間のみ表示
- **誰かが空いていれば可モード（OR）** - いずれかのカレンダーが空いていれば表示
- **曜日・時間帯・バッファ等の詳細設定** - 曜日ごとの有効/無効、受付時間帯、前後バッファ、1日の予約上限
- **第三者向け公開予約ページ** - スラッグベースのURL、ステップ形式のUI
- **予約確定時のGoogleカレンダー予定作成** - 代表カレンダーまたは割当カレンダーに自動作成
- **メール通知** - 予約確定・キャンセル時にオーガナイザーと予約者へ通知
- **競合防止ロック機構** - 同時予約を防ぐスロット単位の楽観ロック

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** + **PostgreSQL** (Supabase)
- **NextAuth.js v5** (Auth.js)
- **Google Calendar API**
- **Nodemailer** (Gmail SMTP)
- **Vitest** (テスト)

## セットアップ手順

### 1. 前提条件

- Node.js 18+
- npm
- PostgreSQL (Supabase推奨)
- Google Cloud Console プロジェクト

### 2. Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/) で新しいプロジェクトを作成
2. 「APIとサービス」→「ライブラリ」から以下を有効化:
   - Google Calendar API
   - Google People API (optional)
3. 「APIとサービス」→「認証情報」→「OAuth同意画面」を設定:
   - テストユーザーを追加 (開発中)
   - スコープ: `openid`, `email`, `profile`, `calendar.readonly`, `calendar.events`
4. 「認証情報」→「OAuth 2.0 クライアントID」を作成:
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みリダイレクトURI:
     - `http://localhost:3000/api/auth/callback/google` (ログイン用)
     - `http://localhost:3000/api/google/callback` (カレンダー接続用)
5. クライアントIDとクライアントシークレットをメモ

### 3. Gmailアプリパスワード設定 (メール通知用)

1. Googleアカウントで2段階認証を有効化
2. セキュリティ → アプリパスワード から生成
3. 16桁のパスワードをメモ

### 4. インストール

```bash
npm install
cp .env.example .env
# .envを編集して各値を設定
```

### 5. DB設定

```bash
npx prisma generate
npx prisma db push
```

### 6. 開発サーバー起動

```bash
npm run dev
```

### 7. テスト実行

```bash
npm run test
```

## 環境変数

`.env.example` を参照して設定してください。

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL接続URL (Supabase) | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `NEXTAUTH_URL` | アプリのベースURL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuthのセッション暗号化キー | `openssl rand -base64 32` で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントシークレット | `GOCSPX-xxx` |
| `GMAIL_USER` | 通知メール送信元Gmailアドレス | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmailアプリパスワード (16桁) | `xxxx xxxx xxxx xxxx` |
| `NEXT_PUBLIC_APP_URL` | フロントエンドのベースURL | `http://localhost:3000` |

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/login/           # ログインページ
│   ├── (dashboard)/            # 認証済みダッシュボード
│   │   ├── dashboard/          # ダッシュボードトップ
│   │   ├── accounts/           # Googleアカウント管理
│   │   ├── scheduling-pages/   # 日程調整ページ管理 (CRUD)
│   │   └── bookings/           # 予約一覧・詳細
│   ├── (public)/book/[slug]/   # 公開予約ページ
│   └── api/
│       ├── auth/               # NextAuth エンドポイント
│       ├── google/             # Google連携 (connect/callback/disconnect/accounts/calendars)
│       ├── scheduling-pages/   # 日程調整ページ CRUD API
│       ├── bookings/           # 予約管理 API
│       └── public/[slug]/      # 公開API (availability/lock/book)
├── components/
│   ├── ui/                     # shadcn/ui コンポーネント
│   ├── booking/                # 予約フロー コンポーネント
│   └── dashboard/              # ダッシュボード コンポーネント
├── lib/
│   ├── auth.ts                 # NextAuth設定
│   ├── prisma.ts               # Prismaクライアント
│   ├── utils.ts                # ユーティリティ
│   ├── availability/           # 空き時間算出ロジック
│   │   ├── calculator.ts       # メイン算出エントリ
│   │   ├── window-generator.ts # 受付可能ウィンドウ生成
│   │   ├── free-intervals.ts   # 空き区間算出
│   │   ├── interval-ops.ts     # 区間演算 (差集合・積集合・和集合)
│   │   ├── slot-generator.ts   # スロット分割
│   │   └── types.ts            # 型定義
│   ├── booking/                # 予約処理
│   │   ├── assignment.ts       # カレンダー割当
│   │   ├── confirm.ts          # 予約確定・Googleカレンダー作成
│   │   └── lock.ts             # スロットロック管理
│   ├── google/                 # Google API連携
│   │   ├── client.ts           # OAuth2クライアント
│   │   ├── calendar.ts         # カレンダー操作
│   │   └── freebusy.ts         # FreeBusy API
│   ├── mail/                   # メール送信
│   │   ├── sender.ts           # Nodemailer送信
│   │   └── templates.ts        # メールテンプレート
│   └── validators/             # バリデーション
│       ├── booking.ts          # 予約データバリデーション
│       └── scheduling-page.ts  # 日程調整ページバリデーション
├── types/
│   └── next-auth.d.ts          # NextAuth型拡張
tests/
└── unit/                       # ユニットテスト
    ├── availability-calculator.test.ts
    ├── free-intervals.test.ts
    ├── interval-ops.test.ts
    └── slot-generator.test.ts
prisma/
└── schema.prisma               # データベーススキーマ
```

## 空き時間算出ロジック

以下のステップで空きスロットを算出します:

1. **対象期間走査** - `dateRangeDays` に基づき、本日から対象日数分の日付を走査
2. **availability window生成** - 曜日ルール (`SchedulingPageWeekdayRule`) と時間帯ルール (`SchedulingPageTimeRule`) から、各日の受付可能ウィンドウ (開始〜終了の区間) を生成
3. **FreeBusy API呼び出し** - 対象カレンダーごとにGoogle Calendar FreeBusy APIを呼び出し、既存予定のbusy区間を取得
4. **バッファ適用** - 各busy区間の前後に `bufferBeforeMinutes` / `bufferAfterMinutes` を加算
5. **free区間算出** - 各カレンダーについて `window - busy` の差集合を計算し、空き区間を算出
6. **モード別結合**
   - `COMMON_FREE` (AND): 全カレンダーの空き区間の積集合
   - `ANY_FREE` (OR): 全カレンダーの空き区間の和集合
7. **スロット分割** - 結合後の空き区間を `slotMinutes` 単位のスロットに分割
8. **既存予約/ロック除外** - 既に予約済みのスロットとアクティブなロックを持つスロットを除外

## API一覧

### 認証

| メソッド | パス | 説明 |
| --- | --- | --- |
| `*` | `/api/auth/*` | NextAuth.js エンドポイント (ログイン・ログアウト・コールバック) |

### Googleアカウント連携

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/google/connect` | Google OAuthフロー開始 (カレンダー接続用) |
| `GET` | `/api/google/callback` | OAuthコールバック処理 |
| `GET` | `/api/google/accounts` | 接続済みGoogleアカウント一覧取得 |
| `POST` | `/api/google/disconnect` | Googleアカウント接続解除 |
| `GET` | `/api/google/calendars` | 指定アカウントのカレンダー一覧取得 |

### 日程調整ページ

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/scheduling-pages` | 日程調整ページ一覧取得 |
| `POST` | `/api/scheduling-pages` | 日程調整ページ新規作成 |
| `GET` | `/api/scheduling-pages/:id` | 日程調整ページ詳細取得 |
| `PUT` | `/api/scheduling-pages/:id` | 日程調整ページ更新 |
| `DELETE` | `/api/scheduling-pages/:id` | 日程調整ページ削除 |

### 予約管理

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/bookings` | 予約一覧取得 |
| `GET` | `/api/bookings/:id` | 予約詳細取得 |
| `POST` | `/api/bookings/:id/cancel` | 予約キャンセル |

### 公開API (認証不要)

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/public/:slug/availability` | 空きスロット取得 |
| `POST` | `/api/public/:slug/lock` | スロットロック取得 |
| `POST` | `/api/public/:slug/book` | 予約確定 |

## 仮定事項

- Supabase PostgreSQLを使用 (他のPostgreSQLホスティングでも動作可能)
- Gmail SMTPでメール送信 (アプリパスワードが必要)
- タイムゾーンはサーバーのlocaleに依存する部分あり (将来改善予定)
- 初期実装では担当者割当は先頭優先 (priorityOrder順)

## 今後の改善候補

- Webhook / リアルタイム通知
- カレンダー変更のポーリング / Push通知
- 予約リマインダーメール
- タイムゾーン選択UI (予約者側)
- 担当者のラウンドロビン割当
- iCal / Outlook連携
- 管理者ダッシュボードの分析機能
- 多言語対応 (i18n)
- スロット単位の柔軟な設定 (15分 / 45分 / カスタム)
- 繰り返し予約
- キャンセル待ち機能

## デプロイ (Vercel)

1. [Vercel](https://vercel.com/) にGitHubリポジトリをインポート
2. 環境変数を設定 (上記の環境変数セクション参照)
3. SupabaseのDirect connection URLを `DATABASE_URL` に設定
4. デプロイ実行

本番環境ではOAuthリダイレクトURIを本番ドメインに更新することを忘れないでください:
- `https://your-domain.com/api/auth/callback/google`
- `https://your-domain.com/api/google/callback`

## ライセンス

MIT
