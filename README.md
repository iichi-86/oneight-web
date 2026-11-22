# oneight 公式Webサイト

地域の個人店舗・小規模事業者向けWebアプリ制作・運用サービス「oneight（ワンエイト）」の公式サイトです。Astro・TypeScript・CSSで構成した静的サイトと、お問い合わせ用のCloudflare Pages Functionsを分離しています。顧客向けアプリや各店舗の顧客データは、このプロジェクトで管理しません。

所有者がCloudflare Pagesで公開し、取得した独自ドメイン [oneight.jp](https://oneight.jp) を接続しました。2026年11月22日にDNSの反映と、HTTPSでのトップページ表示（HTTP 200）を確認しています。検索登録は無効のままです。所有者の「フォームを有効にしてください」という指示に基づく変更をpushしましたが、Cloudflareのビルド失敗で公開反映が止まっています。公開フォームはまだ「受付準備中」です。今後の公開更新、DNS変更、新規契約・課金、秘密情報の設定も、所有者の確認済み範囲で行ってください。

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

今回のフォーム有効化変更は `npm run verify` とGitHub Actionsに成功し、テスト20件と本番条件のローカルビルドで有効化表示を確認しました。WranglerによるFunctionsコンパイルも成功しています。Cloudflareのビルドログによる原因調査と、公開反映・実キーによるTurnstile・実メール到達の確認が残っています。

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
- `src/data/deployment.json`：公式公開URLの既定値（`https://oneight.jp`）、承認済みのフォーム公開状態、本番ブランチ。
- `src/data/contact-release.ts`：ビルド・実行時のフォーム有効化判定。
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
| `PUBLIC_SITE_URL` | 任意の上書き用HTTPS origin。未設定時は `src/data/deployment.json` の `https://oneight.jp` を使用します。パス・クエリ・認証情報を含めません。 |
| `PUBLIC_ALLOW_INDEXING` | 初期値は`false`。内容・法的表示の確認と検索登録の承認後のみ`true`にします。 |
| `PUBLIC_CONTACT_ENABLED` | 任意の上書き。未設定時は承認済みの本番リリース設定を参照。明示的な`false`は停止、空文字・未知の値も停止します。 |
| `PUBLIC_TURNSTILE_SITE_KEY` | ブラウザに表示してよいTurnstile site key。secret keyは入れません。 |

公式公開URLは `https://oneight.jp` です。既定値または `PUBLIC_SITE_URL` の上書き値を主要ページのcanonical・OGPへ反映する構成です。コードの更新が公開済みサイトへ反映されたかは、再ビルド・再デプロイ後に確認してください。`PUBLIC_ALLOW_INDEXING=true` の場合にのみ検索登録を許可し、sitemapに主要ページを含めます。検索登録の抑止中はsitemapを空にし、404は常にnoindexでcanonical・og:urlを付けません。`noindex`やrobotsは閲覧制限ではないため、プレビューに秘密情報や個人情報を置かないでください。

`PUBLIC_` で始まる値はブラウザへ公開される前提です。メール送信用APIキーやTurnstile secret keyは、承認後にCloudflare Pages Functionsの秘密情報として設定し、Git・HTML・フロントエンドには入れません。

## Cloudflare Pagesの構成・更新

初期実装ではデプロイを行わず、その後、所有者がCloudflare Pagesの公開と独自ドメイン設定を実施しました。既存のPagesプロジェクトを使用し、重複して作成しないでください。以下は構成の確認と今後の更新手順です。

1. [公開前チェックリスト](docs/launch-checklist.md) を確認し、事業情報・料金条件・プライバシーポリシー・送信先・公開URLを確定します。
2. 所有者が接続したGitHubリポジトリ・本番ブランチ・Cloudflareアカウントを使用します。対象ブランチへのpushは既存の自動デプロイを開始するため、承認された変更だけを反映します。
3. 既存PagesプロジェクトのフレームワークをAstro、ビルドコマンドを `npm run build`、出力ディレクトリを `dist`、ルートをこのプロジェクトとして確認します。Node.jsは24（`NODE_VERSION=24`）を使用します。
4. ProductionとPreviewの環境変数を分けます。Previewは `PUBLIC_ALLOW_INDEXING=false`、お問い合わせ送信は無効にしておきます。本番の公開URL・検索登録・送信有効化は、承認済みの値を設定します。
5. [お問い合わせの設定](docs/contact-setup.md) に従い、承認済みの外部サービスとPages Functionsの秘密情報を設定します。ルートの `functions/` がデプロイに含まれる構成を維持してください。`dist/` の静的ファイルだけを配信するホスティングでは送信APIは動きません。
6. 承認された公開方法でデプロイし、全ページ、404、スマートフォン表示、フォームの成功・失敗、メール到達、canonical・robots・sitemapを確認します。独自ドメイン・DNSの設定は別途承認後に行います。

環境変数の変更後は再ビルド・再デプロイが必要です。追加のホスティングサービスは使用せず、所有者の既存Cloudflare Pagesへの自動デプロイを利用します。所有者からProduction変数7件の登録とResendのドメインVerifiedを報告いただき、関連DNS3件の公開応答も確認しています。実キーの値・有効性、実行時バインディング、実メール到達は未検証です。

フォームは、両有効化フラグが未設定の場合、`deployment.json` の承認済み設定に従います。画面側はCloudflare Pagesの本番ブランチ `feat/oneight-official-site` と公式originが一致するビルド、API側は許可origin・リクエストoriginが公式originに一致する場合に限って有効化します。必須キーが不足するAPIは503を返します。`PUBLIC_CONTACT_ENABLED`・`CONTACT_ENABLED` の追加手入力は不要です。停止する場合は両方を `false` にして再ビルド・再デプロイしてください。本番ブランチ変更時は `deployment.json` の `contact.productionBranch` も更新します。詳細は [お問い合わせの設定](docs/contact-setup.md) を参照してください。

企画・表現の判断は [デザインとコンテンツ](docs/design-and-content.md)、残る確認事項は [公開前チェックリスト](docs/launch-checklist.md) にまとめています。
