# 検証記録

制作中の検証と、所有者による外部設定後の確認をまとめています。互換修正 `536e65fa` はGitHub ActionsとPagesデプロイに成功し、公式ドメインでフォーム有効化とTurnstile Success表示を確認しました。その後、所有者が実フォーム送信のGmail到達を報告しています。エージェントは実送信・メールボックス閲覧を行っておらず、プロバイダログ・返信先は未確認です。検索許可設定も `ad8096a` の再デプロイで反映し、公開ページの検索許可・robots・sitemapを確認済みです。その後、Search Consoleの所有権確認・サイトマップ送信・インデックス登録依頼が完了したと所有者から報告されています。検索結果への掲載は未確認です。

## 事業モデル改訂の確認版

現在の改訂は `feat/oneight-problem-solving` で準備しています。本番ブランチへの反映は未実施です。

- 課題発見から開発・運用改善までの方針、条件達成時の固定報酬、税込月額3プラン、実家の和菓子屋を起点にする想いを反映しました。実績・効果・法人格は創作していません。
- `npm run verify` が成功。Astro18ファイルで指摘0、Functions型検査、既存の20テスト、7ページの生成、内部参照・SEO・CSPを確認しました。
- ソースコミット `452fe8f` の [GitHub Actions](https://github.com/iichi-86/oneight-web/actions/runs/45010884908) とCloudflare Pagesが成功。CIにはPagesと同世代のWrangler 3.114.17によるFunctions互換検査も含みます。
- 環境内の `sites-preview start /workspace/oneight-content` はrelay readinessエラーで失敗。statusは停止中でした。別サーバーやネットワーク迂回は行わず、既存のCloudflare Pagesのブランチプレビューを使用しました。
- [確認版](https://feat-oneight-problem-solving.oneight-web.pages.dev/)（デプロイ `da4e3613-183c-4a40-8149-338054beff14`）を幅1180pxのブラウザで確認。トップ、サービス、料金、事業紹介、相談ページへナビゲーションでき、税込の固定報酬・月額3プランと事業説明が表示されました。確認したページに横方向のはみ出しはありませんでした。
- トップのFAQ「月額料金は、いつからかかりますか？」を開き、解決後の継続契約から開始する説明が展開されることを確認しました。サービスページの画像読み込みエラーはありませんでした。
- Previewの `noindex, nofollow` と相談フォームの `data-enabled=false`・送信ボタン無効・Turnstileなしを確認。メール実送信は行っていません。本番ブランチ・本番環境変数は変更していません。
- 画面証跡は `/workspace/shared/oneight-revision/home-desktop.jpg` と `pricing-desktop.jpg`。スマートフォン実機・モバイル幅の描画、支援技術、表示速度の実測は未検証です。レスポンシブCSSと生成物の検査は行っていますが、実機検証の代替とは扱いません。
- メール送信処理・本番のキー・検索許可・DNSは変更していません。公開中のサイトの実送信到達、Googleへの登録操作は所有者の報告で確認しています。

## 既存公開サイトの検証記録

| 検証 | 結果 |
| --- | --- |
| 互換修正後の `npm run verify` | 成功。Astro 18ファイルで指摘0、API・公開判定テスト20件成功、7ページのビルド、内部参照・SEO・CSPの検査を完了 |
| Astroの静的解析 | 18ファイル、エラー0・警告0・ヒント0 |
| Pages FunctionsのTypeScript解析 | 成功（`tsc --project tsconfig.functions.json --noEmit`） |
| GitHub Actions（互換修正） | `536e65fa` の [run 44995923468](https://github.com/iichi-86/oneight-web/actions/runs/44995923468) が成功。`npm ci`・`npm run verify`・Wrangler 3.114.17のFunctions互換検査がすべて成功 |
| 互換修正のCI検査 | `WRANGLER_SEND_METRICS=false` で旧Wranglerのコンパイルを実行し、成功。CIのこの検査はデプロイしない |
| Cloudflare Pages（初回失敗） | `7c1cf4e` のビルドで内蔵Wrangler 3.114.17がJSON import属性 `with { type: 'json' }` を解析できず `Expected ; but found with`。TypeScriptへの設定移動で修正 |
| Cloudflare Pages（互換修正） | `536e65fa` のデプロイ `bc17c681-1697-416e-ab66-51e04d4d1c69` が成功（2026年11月22日15:56 日本時間）。確認URL：[bc17c681.oneight-web.pages.dev](https://bc17c681.oneight-web.pages.dev) |
| 問い合わせAPI・公開判定の自動テスト | 20件成功、失敗0。外部APIはモックで検証 |
| 初期設定でのAstroビルド | 主要6ページ・404の計7ページを生成 |
| 生成物の検査 | ページ・内部リンク・画像参照・アンカー・SEO・初期noindex設定を確認、成功 |
| CSPの検査 | 現在の生成物で成功。生成物の一時コピーからインラインscriptのハッシュ、Turnstileの許可先をそれぞれ削除すると検査が失敗することも確認 |
| 初回のFunctionsコンパイル | `7c1cf4e` はWrangler 4.165.0で成功。ただしPages内蔵3.114.17の互換性は保証できず、実際の公開ビルドは失敗 |
| 互換修正後のFunctionsコンパイル | Pagesと同じWrangler 3.114.17で成功。終了コード0、`Compiled Worker successfully` を確認。その後、CIとPagesデプロイも成功 |
| フォームの本番条件ビルド | `CF_PAGES=1` と本番ブランチ、検証用の公開site keyでローカルビルド。`data-enabled=true`、Turnstile要素、準備中表示なしをassert |
| 通常のローカルビルド | `data-enabled=false`、受付準備中表示、Turnstile要素なしをassert |
| プライバシーページの生成物 | 公開窓口のmailtoリンクと、確認用placeholderが残っていないことをローカル生成物でassert |
| 公開フォームのブラウザ確認 | `https://oneight.jp/contact/` を再読み込みし、`data-enabled=true`、実際の公開site key、準備中noticeなし、相談ボタン有効、Turnstile Success表示を確認 |
| 公開フォームの必須検証 | 空入力で全必須エラーを表示し、問い合わせAPIへの送信は発生しないことを確認。実メール送信なし |
| 公開プライバシーページ | 実際の構成・運営者oneight・提示済み連絡窓口が反映され、placeholderが残っていないことを確認 |
| 公開URL設定ありのSEO分岐 | 一時出力にて6ページのcanonical・OGP・sitemap・robots、404 noindexのNode assertions成功。テスト用originは本番へ未設定 |
| 本番依存関係の既知脆弱性検査 | npm audit --omit=dev：検出0件（検査時点の情報） |
| 初回の生成物サイズ | `dist/` 全体で約268 KB。計測時点の概算 |
| 独自ドメインの公開DNS（2026年11月22日） | Google・Cloudflare双方でNSが `joaquin.ns.cloudflare.com` と `riya.ns.cloudflare.com` に一致し、A・AAAAの応答も確認 |
| 独自ドメインのHTTPS（2026年11月22日） | `https://oneight.jp` がHTTP 200を返し、oneightのトップページであることを確認 |
| ResendのSecret登録 | 所有者の操作報告・画面で確認。秘密情報の実値・プロバイダログは未確認 |
| Production変数7件 | 所有者から登録完了の報告。秘密情報の実値、各値の正確性と実行時バインディングは未検証 |
| Resend送信ドメイン認証 | 所有者からSTATUS Verifiedの報告。関連DNS3件の公開応答も確認済み |
| 所有者による実フォーム送信 | 所有者が送信し、Gmailへの到達を確認したとの報告。エージェントによる送信・メールボックス閲覧なし。プロバイダログ・返信先は未確認 |
| 検索許可設定 | 所有者のProduction設定を反映した `ad8096a` がCIとCloudflare Pagesで成功。デプロイ `8028b8cd-4147-4b94-889c-d2576d241ad5` |
| 検索許可の公開確認 | トップ・お問い合わせページの `index, follow` と公式canonical、フォーム有効化を確認。robotsは `Allow: /`・`Disallow: /api/`・正式sitemap URL、sitemapは主要6ページを掲載。Googleでの掲載確認とは別 |
| 検索許可設定のローカル生成物 | `PUBLIC_ALLOW_INDEXING=true` とPages本番条件・ローカル検証用公開site keyでビルド成功。同設定の `verify-build.mjs` が「検索登録: 許可」で成功し、主要6ページ・404・内部参照・SEO・CSPを確認。コード変更なしのためAPIテスト20件は再実行せず、直前CIの成功結果を参照 |
| Google Search Console | 所有者から所有権確認・sitemap送信・インデックス登録依頼の完了報告。検索結果への掲載は未確認 |

`npm run verify` で静的解析・APIテスト・ビルド・生成物検査をまとめて再実行できます。生成物の検査にはCSPも含め、ビルドされたインラインスクリプトのハッシュ、自サイトの外部スクリプト参照、Turnstileの許可先を確認します。

互換修正ではフォームの公開状態・公式origin・本番ブランチを `src/data/contact-release.ts` へ直接定義し、FunctionsからJSONのimport属性を除去しました。`src/data/deployment.json` はcanonical等の公開URL設定に使用します。本番限定判定や停止フラグを維持し、修正後のテスト・Pages相当の旧Wranglerコンパイル・公開フォームへの反映まで確認済みです。

## ブラウザ確認

公開後のデスクトップブラウザで、上表の問い合わせフォームとプライバシーページを確認しました。作業環境の画面証跡は `/workspace/shared/oneight-qa/contact-enabled.jpg` です。TurnstileのSuccess表示はブラウザ側の確認であり、サーバー側Siteverifyやメール送信を実行した結果ではありません。

初期制作時のローカルプレビューは中継環境のエラーで開始できませんでした。今回の公開ページ確認で、全ページ・全端末の確認が完了したとは扱いません。モバイル表示、トップページ・料金・メニュー等の網羅的な操作、キーボード操作、動きを減らす設定、表示速度は未検証です。

検索許可の画面証跡は `/workspace/shared/oneight-qa/search-allowed.jpg` です。

## 引き続き必要な確認

- 本番の検索許可は公開反映確認済み。Previewの検索許可はfalseを維持する。
- 所有者報告で完了したGoogle Search Consoleの登録依頼について、検索結果への反映を別途確認する。
- Pages上での `_headers` 適用、404のHTTPステータス、Functionsの実行。
- 実メールの返信先を確認する。Gmail到達は本人報告済みで、プロバイダログはエージェント未確認。
- メール事業者やCloudflareの障害時、送信失敗時の利用者向け表示。
- 正式な事業者情報、連絡窓口、保存期間、外部委託先等を反映した法的表示。
- 実機での表示速度・操作・支援技術による確認。Lighthouse等の実測スコアは未記録。

APIの自動テストは実メールの到達確認ではありません。`npm run dev` と `npm run preview` はAstroの表示確認用で、Pages Functionsを実行しません。設定と結合確認は [お問い合わせの設定](contact-setup.md)、公開判断は [公開前チェックリスト](launch-checklist.md) に従ってください。
