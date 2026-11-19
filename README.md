# oneight 公式Webサイト

地域の個人店舗・小規模事業者向けWebアプリ制作・運用サービス「oneight（ワンエイト）」の公式サイトです。Astro・TypeScript・CSSで構成した静的サイトと、お問い合わせ用のCloudflare Pages Functionsを分離しています。顧客向けアプリや各店舗の顧客データは、このプロジェクトで管理しません。

現在は公開前の制作段階です。サービスの機能・提供範囲・料金・税区分・契約条件には未確定の内容があります。本番公開、DNS変更、新規外部サービスの契約・課金、秘密情報の設定は、所有者の確認後に行ってください。このリポジトリを用意しただけでは、公開やメールの送信設定は完了しません。

## ローカルで確認する

Node.js 24とnpmを使用します。

```sh
npm ci
cp .env.example .env
npm run dev
```

ターミナルに表示されるローカルURLを開いてください。初期状態では検索エンジンへの登録を抑止し、お問い合わせの実送信も無効にします。Astroの開発・プレビューサーバーではPages Functionsは実行されません。送信処理の設定とローカル確認方法は [お問い合わせの設定](docs/contact-setup.md) を参照してください。

## 検証する

```sh
npm run verify
```

Astro・TypeScriptの静的解析、お問い合わせ処理のテスト、本番ビルド、生成物の検査を順に実行します。生成物の検査では、主要6ページと404、内部リンク・画像参照、ページ固有のtitle・description・h1、OGP・favicon・robots・sitemap、公開URLと検索登録、CSPでのスクリプト実行許可を確認します。

個別に実行する場合は次のとおりです。

```sh
npm run check
npm test
npm run build
node scripts/verify-build.mjs
npm run preview
```

自動検査で確認できるのはコードと生成物です。実機での操作、見た目、メール到達、Turnstile、外部サービスの設定、法的表示は別途確認してください。検査の結果は実際のコマンド出力と [検証記録](docs/validation.md) で確認します。npmのAstro実行コマンドでは `ASTRO_TELEMETRY_DISABLED=1` を指定しています。

## ページと更新箇所

| パス | 内容 |
| --- | --- |
| `/` | サービス概要・利用イメージ・特徴・導入フロー・FAQ |
| `/service/` | 想定する機能・利用シーン・運用の考え方 |
| `/pricing/` | 提供予定価格・未確定条件・個別相談の範囲 |
| `/about/` | ブランドの紹介・事業への姿勢 |
| `/contact/` | お問い合わせフォーム・受付状態 |
| `/privacy/` | 個人情報の取り扱いと公開前確認事項 |
| `/404.html` | 存在しないページの案内 |

- `src/data/site.ts`：ブランド情報、提供予定価格、未確定条件、FAQ、公開状態の参照元。
- `src/pages/`：各ページの文章と構成。`robots.txt.ts` と `sitemap.xml.ts` もここにあります。
- `src/layouts/`・`src/components/`・`src/styles/`：共通レイアウト、ロゴ、画面イメージ、デザイン。
- `public/`：favicon、OG画像などの静的ファイル。
- `functions/api/contact.ts`：`POST /api/contact` の検証・スパム対策・メール送信。
- `tests/`・`scripts/verify-build.mjs`：送信処理のテストと生成物の検査。
- `scripts/security-headers.mjs`：生成されたインラインスクリプトのハッシュを `dist/_headers` のCSPへ反映。`npm run build` で自動実行します。生成後のHTMLを変更した場合は再ビルドしてください。

画面イメージは架空の利用例です。許可を得た実画面や実績を掲載する際は、イメージ表記・画像・説明をまとめて更新してください。

## 公開URL・検索登録

`.env.example` を基に環境ごとの値を設定します。

| 設定 | 用途 |
| --- | --- |
| `PUBLIC_SITE_URL` | 決定した公開先のHTTPS origin。パス・クエリ・認証情報を含めません。未設定ならcanonical・絶対URLの生成を保留します。 |
| `PUBLIC_ALLOW_INDEXING` | 初期値は`false`。内容・公開先・法的表示の確認と本番公開の承認後のみ`true`にします。 |
| `PUBLIC_CONTACT_ENABLED` | 実際の送信先・サーバー設定・個人情報の取り扱いを確認後に有効化します。 |
| `PUBLIC_TURNSTILE_SITE_KEY` | ブラウザに表示してよいTurnstile site key。secret keyは入れません。 |

公開URLが決まるまでは仮のドメインを埋め込まないでください。`PUBLIC_SITE_URL` はcanonical・OGPへ反映します。検索登録は、公開URLがあり、かつ `PUBLIC_ALLOW_INDEXING=true` の場合にのみ許可し、sitemapに主要ページを含めます。公開前のsitemapは空にします。404は常にnoindexです。`noindex`やrobotsは閲覧制限ではないため、プレビューに秘密情報や個人情報を置かないでください。

`PUBLIC_` で始まる値はブラウザへ公開される前提です。メール送信用APIキーやTurnstile secret keyは、承認後にCloudflare Pages Functionsの秘密情報として設定し、Git・HTML・フロントエンドには入れません。

## Cloudflare Pagesへの公開準備

**以下は承認後に実施する手順です。このプロジェクト作成時にはデプロイしていません。**

1. [公開前チェックリスト](docs/launch-checklist.md) を確認し、事業情報・料金条件・プライバシーポリシー・送信先・公開URLを確定します。
2. 所有者がGitHubの対象リポジトリとCloudflareアカウントを選び、Git連携による自動公開の開始を承認します。Pagesプロジェクト作成や対象ブランチへのpushでデプロイが始まる場合があります。
3. Cloudflare PagesのGit連携で対象リポジトリを選び、フレームワークをAstro、ビルドコマンドを `npm run build`、出力ディレクトリを `dist`、ルートをこのプロジェクトに設定します。Node.jsは24（`NODE_VERSION=24`）に指定します。
4. ProductionとPreviewの環境変数を分けます。Previewは `PUBLIC_ALLOW_INDEXING=false`、お問い合わせ送信は無効にしておきます。本番の公開URL・検索登録・送信有効化は、承認済みの値を設定します。
5. [お問い合わせの設定](docs/contact-setup.md) に従い、承認済みの外部サービスとPages Functionsの秘密情報を設定します。ルートの `functions/` がデプロイに含まれる構成を維持してください。`dist/` の静的ファイルだけを配信するホスティングでは送信APIは動きません。
6. 承認された公開方法でデプロイし、全ページ、404、スマートフォン表示、フォームの成功・失敗、メール到達、canonical・robots・sitemapを確認します。独自ドメイン・DNSの設定は別途承認後に行います。

Git連携後は、本番ブランチへのpushが本番更新になることがあります。公開承認が済むまでは、その接続と自動デプロイを開始しないでください。環境変数の変更後は再ビルド・再デプロイが必要です。

企画・表現の判断は [デザインとコンテンツ](docs/design-and-content.md)、残る確認事項は [公開前チェックリスト](docs/launch-checklist.md) にまとめています。
