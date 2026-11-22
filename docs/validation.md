# 検証記録

制作中の検証と、その後の所有者による公開作業の確認をまとめています。初期実装時は外部設定を行わず、その後、所有者がCloudflare Pagesの公開、独自ドメインの取得・接続、Production変数の登録とResendの送信ドメイン認証を進めました。所有者の指示に基づくフォーム有効化リリースは、ローカルの静的解析・テスト・本番条件での生成物確認まで完了しています。今回の変更のpush・デプロイと実メール到達は未確認です。

## 確認済み

| 検証 | 結果 |
| --- | --- |
| 今回の `npm run verify` | 成功。静的解析、API・公開判定テスト、7ページのビルド、内部参照・SEO・CSPの検査を完了 |
| Astroの静的解析 | 18ファイル、エラー0・警告0・ヒント0 |
| Pages FunctionsのTypeScript解析 | 成功（`tsc --project tsconfig.functions.json --noEmit`） |
| GitHub Actions（初期実装時） | `npm ci`・`npm run verify` 成功。今回の変更のpush後の結果は未確認 |
| 問い合わせAPI・公開判定の自動テスト | 20件成功、失敗0。外部APIはモックで検証 |
| 初期設定でのAstroビルド | 主要6ページ・404の計7ページを生成 |
| 生成物の検査 | ページ・内部リンク・画像参照・アンカー・SEO・初期noindex設定を確認、成功 |
| CSPの検査 | 現在の生成物で成功。生成物の一時コピーからインラインscriptのハッシュ、Turnstileの許可先をそれぞれ削除すると検査が失敗することも確認 |
| Cloudflare Pages Functions互換性 | 今回のコードをWrangler 4.165.0の `pages functions build functions` でコンパイル成功。デプロイ・公開API実行ではない |
| フォームの本番条件ビルド | `CF_PAGES=1` と本番ブランチ、検証用の公開site keyでローカルビルド。`data-enabled=true`、Turnstile要素、準備中表示なしをassert。実キーによるTurnstile検証は未実施 |
| プライバシーページの生成物 | 公開窓口のmailtoリンクと、確認用placeholderが残っていないことをローカル生成物でassert |
| 公開URL設定ありのSEO分岐 | 一時出力にて6ページのcanonical・OGP・sitemap・robots、404 noindexのNode assertions成功。テスト用originは本番へ未設定 |
| 本番依存関係の既知脆弱性検査 | npm audit --omit=dev：検出0件（検査時点の情報） |
| 初回の生成物サイズ | `dist/` 全体で約268 KB。計測時点の概算 |
| 独自ドメインの公開DNS（2026年11月22日） | Google・Cloudflare双方でNSが `joaquin.ns.cloudflare.com` と `riya.ns.cloudflare.com` に一致し、A・AAAAの応答も確認 |
| 独自ドメインのHTTPS（2026年11月22日） | `https://oneight.jp` がHTTP 200を返し、oneightのトップページであることを確認 |
| ResendのSecret登録 | 所有者の操作報告・画面で確認。キーの有効性、実行時の読み込み、メール到達は未検証 |
| Production変数7件 | 所有者から登録完了の報告。秘密情報の実値、各値の正確性と実行時バインディングは未検証 |
| Resend送信ドメイン認証 | 所有者からSTATUS Verifiedの報告。関連DNS3件の公開応答も確認済み。実送信・到達は未検証 |

`npm run verify` で静的解析・APIテスト・ビルド・生成物検査をまとめて再実行できます。生成物の検査にはCSPも含め、ビルドされたインラインスクリプトのハッシュ、自サイトの外部スクリプト参照、Turnstileの許可先を確認します。

## ブラウザ確認

デスクトップ・スマートフォンの目視・操作確認は未実施です。管理環境の sites-preview が「relay could not open browser port 4173: timed out waiting for relay readiness」で停止し、ブラウザへの中継を開始できませんでした。残存した開発サーバーを片付け、ブラウザの起動確認後に再試行しましたが同じ環境エラーが続きました。別の配信経路で迂回せず、この検証は未完了として残しています。コード確認で見つかった小画面の価格文字サイズと折り返しは修正済みですが、実機確認の代替ではありません。確認対象は、トップページの最初の画面、ページ間の導線、料金表示、メニュー、フォームの受付準備中表示、キーボード操作、横はみ出し、動きを減らす設定です。

## 今後の更新・受付開始前に必要な確認

- 今回の変更をpush・デプロイし、公開サイトでフォームの有効化と表示を確認する。ローカル検証を公開環境の確認済みとは扱わない。
- ソースの公式URL既定値は `src/data/deployment.json` の `https://oneight.jp` を使用。公開反映後のcanonical・OGP・robots・sitemapを確認する。検索登録は `PUBLIC_ALLOW_INDEXING=false` を維持。
- Pages上での `_headers` 適用、404のHTTPステータス、Functionsの実行。
- 承認済みホストと実キーでのTurnstile確認、メール受付・受信箱への到達・返信先の確認。
- メール事業者やCloudflareの障害時、送信失敗時の利用者向け表示。
- 正式な事業者情報、連絡窓口、保存期間、外部委託先等を反映した法的表示。
- 実機での表示速度・操作・支援技術による確認。Lighthouse等の実測スコアは未記録。

APIの自動テストは実メールの到達確認ではありません。`npm run dev` と `npm run preview` はAstroの表示確認用で、Pages Functionsを実行しません。設定と結合確認は [お問い合わせの設定](contact-setup.md)、公開判断は [公開前チェックリスト](launch-checklist.md) に従ってください。
