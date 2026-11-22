# ONE EIGHT 公式Webサイト

地域の個人店の課題発見から、専用Webサイト・アプリ・業務システムの開発、運用・改善まで支援する「ONE EIGHT（ワンエイト）」の公式サイトです。確認済みの事業モデルは [事業モデル](docs/business-model.md) を参照してください。Astro・TypeScript・CSSで構成した静的サイトと、お問い合わせ用のCloudflare Pages Functionsを分離しています。顧客向けアプリや各店舗の顧客データは、このプロジェクトで管理しません。

この改訂では、条件達成時の固定報酬3万〜20万円程度と、解決後の月額5,000円・10,000円・20,000円を分けて説明しています。すべて税込です。既存ロゴ・配色を引き継ぎ、架空の実績や無制限の対応範囲は追加していません。確認用ブランチ `feat/oneight-problem-solving` から、本番ブランチ `feat/oneight-official-site` への反映は所有者の確認後に行います。

改訂の [確認用プレビュー](https://feat-oneight-problem-solving.oneight-web.pages.dev/) と [Draft PR #2](https://github.com/iichi-86/oneight-web/pull/2) を用意しました。所有者の表現訂正を反映し、成功報酬を最優先に、かわいいお店のイラストと青・コーラル・黄色・ミントの配色、自然な日本語へ再改訂しました。ソースコミット `18ba4c9` はGitHub Actions・Cloudflare Pagesともに成功し、デスクトップで主要ページ、料金3プラン、FAQ、Previewのnoindex・送信停止を確認しています。モバイル実機の表示は未検証です。

所有者がCloudflare Pagesで公開し、取得した独自ドメイン [oneight.jp](https://oneight.jp) を接続しました。2026年11月22日、フォーム有効化の修正 `536e65fa` のデプロイ成功と、[公開フォーム](https://oneight.jp/contact/) の有効化表示・必須入力エラー・TurnstileのSuccess表示を実ブラウザで確認しました。その後、所有者が自分で実フォームを送信し、Gmailへの到達を確認したと報告しています。Productionの `PUBLIC_ALLOW_INDEXING=true` を反映した再デプロイも成功し、公開サイトの検索許可設定を確認しました。その後、Google Search Consoleの所有権確認・サイトマップ送信・掲載リクエストも完了したと所有者から報告されています。今後の公開更新、DNS変更、新規契約・課金、秘密情報の設定も、所有者の確認済み範囲で行ってください。

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

公開設定をTypeScriptへ移してJSONのimport属性を除去し、Pages内蔵Wrangler 3.114.17の構文互換性を修正しました。`npm run verify`（テスト20件）、同版WranglerでのFunctionsコンパイル、修正 `536e65fa` のGitHub ActionsとPagesデプロイは成功しています。実メール到達は本人報告で確認済み、プロバイダログ・返信先・モバイル表示は未確認です。詳しくは [検証記録](docs/validation.md) を参照してください。

互換修正のCIには、`npm run verify` に加えてWrangler 3.114.17でFunctionsをコンパイルする検査を追加し、成功を確認しました。Pagesと同じ世代で構文互換性を確認するための検査で、このCIステップではデプロイは行いません。

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
- `src/data/deployment.json`：canonical・OGP等に使う公式公開URLの既定値（`https://oneight.jp`）。
- `src/data/contact-release.ts`：承認済みのフォーム公開状態・公式origin・本番ブランチと、ビルド・実行時の有効化判定。
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

所有者が保存した `PUBLIC_ALLOW_INDEXING=true` をコミット `ad8096a` の再デプロイで反映しました。公開トップ・お問い合わせページの `index, follow` とcanonical、robotsのクロール許可、主要6ページのsitemapを確認済みです。Google Search Consoleの所有権確認・sitemap送信・インデックス登録依頼は、その後の所有者報告で完了を確認しています。検索結果の掲載は未確認です。検索設定を許可しても、検索結果への掲載や順位は保証されません。

`PUBLIC_` で始まる値はブラウザへ公開される前提です。メール送信用APIキーやTurnstile secret keyは、承認後にCloudflare Pages Functionsの秘密情報として設定し、Git・HTML・フロントエンドには入れません。

## Cloudflare Pagesの構成・更新

初期実装ではデプロイを行わず、その後、所有者がCloudflare Pagesの公開と独自ドメイン設定を実施しました。既存のPagesプロジェクトを使用し、重複して作成しないでください。以下は構成の確認と今後の更新手順です。

1. [公開前チェックリスト](docs/launch-checklist.md) を確認し、事業情報・料金条件・プライバシーポリシー・送信先・公開URLを確定します。
2. 所有者が接続したGitHubリポジトリ・本番ブランチ・Cloudflareアカウントを使用します。対象ブランチへのpushは既存の自動デプロイを開始するため、承認された変更だけを反映します。
3. 既存PagesプロジェクトのフレームワークをAstro、ビルドコマンドを `npm run build`、出力ディレクトリを `dist`、ルートをこのプロジェクトとして確認します。Node.jsは24（`NODE_VERSION=24`）を使用します。
4. ProductionとPreviewの環境変数を分けます。Previewは `PUBLIC_ALLOW_INDEXING=false`、お問い合わせ送信は無効にしておきます。本番の公開URL・検索登録・送信有効化は、承認済みの値を設定します。
5. [お問い合わせの設定](docs/contact-setup.md) に従い、承認済みの外部サービスとPages Functionsの秘密情報を設定します。ルートの `functions/` がデプロイに含まれる構成を維持してください。`dist/` の静的ファイルだけを配信するホスティングでは送信APIは動きません。
6. 承認された公開方法でデプロイし、全ページ、404、スマートフォン表示、フォームの成功・失敗、メール到達、canonical・robots・sitemapを確認します。独自ドメイン・DNSの設定は別途承認後に行います。

環境変数の変更後は再ビルド・再デプロイが必要です。追加のホスティングサービスは使用せず、所有者の既存Cloudflare Pagesへの自動デプロイを利用します。所有者からProduction変数7件の登録、ResendのドメインVerified、実フォーム送信のGmail到達を報告いただき、関連DNS3件の公開応答も確認しています。エージェントは実送信・メールボックス閲覧を行っておらず、プロバイダログ・返信先は未確認です。

フォームは、両有効化フラグが未設定の場合、`src/data/contact-release.ts` の承認済み設定に従います。画面側はCloudflare Pagesの本番ブランチ `feat/oneight-official-site` と公式originが一致するビルド、API側は許可origin・リクエストoriginが公式originに一致する場合に限って有効化します。必須キーが不足するAPIは503を返します。`PUBLIC_CONTACT_ENABLED`・`CONTACT_ENABLED` の追加手入力は不要です。停止する場合は両方を `false` にして再ビルド・再デプロイしてください。本番ブランチ変更時は同TSファイルの本番ブランチ設定も更新します。詳細は [お問い合わせの設定](docs/contact-setup.md) を参照してください。

企画・表現の判断は [デザインとコンテンツ](docs/design-and-content.md)、残る確認事項は [公開前チェックリスト](docs/launch-checklist.md) にまとめています。
