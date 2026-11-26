# ONE EIGHT 公式Webサイト

飲食店・美容院・小売店・ネイルサロン・ヨガ教室など、地域のお店・教室の課題発見から、専用Webサイト・アプリ・業務システムの開発、運用・改善まで支援する「ONE EIGHT（ワンエイト）」の公式サイトです。確認済みの事業モデルは [事業モデル](docs/business-model.md) を参照してください。Astro・TypeScript・CSSで構成した静的サイトと、お問い合わせ用のCloudflare Pages Functionsを分離しています。顧客向けアプリや各店舗の顧客データは、このプロジェクトで管理しません。

この改訂では、Webサイト・アプリ開発と、お店の課題に合う製品を制作・提供するコンサルを分けて説明します。開発は初期費用0円・初月の月額0円、2か月目から月額20,000円。コンサルはヒアリング無料、製品の提供時に100,000円、製品の提供・納品日から2週間以内は70％（70,000円）返金可です。コンサルの製品維持費は改良・改善に充て、金額等は個別に案内します。すべて税込で、旧成功報酬と月額3プランは撤去しました。

トップから「無料でひとこと相談する」で直接フォームへ進めます。必須は返信用メール・相談内容・同意のみで、名前・店舗名／教室名・業種は任意です。20文字の最低制限を外し、短い相談も送れるようにしています。

トップの案内は、チームの事業紹介、無料相談、サービスごとの料金の順です。最初に何をつくり、どこまで支援するかを説明してから、相談と料金をご案内します。

Webサイト・アプリ開発の「初期費用0円」をトップの主見出しと大きな数字で訴求し、最初の1か月は月額も0円、2か月目から税込月額20,000円という条件を近接表示します。0円の対象はこの開発プランで、製品づくりのコンサルは別料金と明示しています。

0円で始めるための特別な条件や契約はないという所有者の方針を、トップ・開発カード・FAQにも表示しています。

参考サイトの見た目・文章・構成を取り入れる指示に合わせ、大きな見出し、オリジナルの製品画面イメージ、黒・白・ライムの配色へ刷新しました。対応領域・制作イメージ・進め方を伝え、途中の相談ボタンと固定の相談リンクから簡単なフォームへ進めます。固定リンクはフォームとプライバシーページには表示しません。[確認用プレビュー](https://feat-oneight-problem-solving.oneight-web.pages.dev/) と [Draft PR #2](https://github.com/iichi-86/oneight-web/pull/2) で内容を確認する構成です。本番ブランチ `feat/oneight-official-site` への反映は所有者の確認後に行います。最新の検証範囲は [検証記録](docs/validation.md) を参照してください。

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
| `/pricing/` | 2つのサービス料金・お試し・返金条件・個別確認事項 |
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
