# 検証記録

制作中に確認した結果と、外部設定後に必要な確認をまとめています。公開・契約・秘密情報の設定・実メール送信は行っていません。

## 確認済み

| 検証 | 結果 |
| --- | --- |
| Astroの静的解析 | 17ファイル、エラー0・警告0・ヒント0 |
| Pages FunctionsのTypeScript解析 | 成功（`tsc --project tsconfig.functions.json --noEmit`） |
| 問い合わせAPIの自動テスト | 11件成功、失敗0。外部APIはモックで検証 |
| 初期設定でのAstroビルド | 主要6ページ・404の計7ページを生成 |
| 生成物の検査 | ページ・内部リンク・画像参照・アンカー・SEO・初期noindex設定を確認、成功 |
| CSPの検査 | 現在の生成物で成功。生成物の一時コピーからインラインscriptのハッシュ、Turnstileの許可先をそれぞれ削除すると検査が失敗することも確認 |
| Cloudflare Pages Functions互換性 | Wrangler 4.165.0 のローカルbuildでWorkerコンパイル成功。デプロイは未実施 |
| 公開URL設定ありのSEO分岐 | 一時出力にて6ページのcanonical・OGP・sitemap・robots、404 noindexのNode assertions成功。テスト用originは本番へ未設定 |
| 本番依存関係の既知脆弱性検査 | npm audit --omit=dev：検出0件（検査時点の情報） |
| 初回の生成物サイズ | `dist/` 全体で約268 KB。計測時点の概算 |

`npm run verify` で静的解析・APIテスト・ビルド・生成物検査をまとめて再実行できます。生成物の検査にはCSPも含め、ビルドされたインラインスクリプトのハッシュ、自サイトの外部スクリプト参照、Turnstileの許可先を確認します。

## ブラウザ確認

デスクトップ・スマートフォンの目視・操作確認は未実施です。管理環境の sites-preview が「relay could not open browser port 4173: timed out waiting for relay readiness」で停止し、ブラウザへの中継を開始できませんでした。残存した開発サーバーを片付け、ブラウザの起動確認後に再試行しましたが同じ環境エラーが続きました。別の配信経路で迂回せず、この検証は未完了として残しています。コード確認で見つかった小画面の価格文字サイズと折り返しは修正済みですが、実機確認の代替ではありません。確認対象は、トップページの最初の画面、ページ間の導線、料金表示、メニュー、フォームの受付準備中表示、キーボード操作、横はみ出し、動きを減らす設定です。

## 外部設定・公開前に必要な確認

- 実際の公開URLを設定したcanonical・OGP・robots・sitemapの整合。
- Pages上での `_headers` 適用、404のHTTPステータス、Functionsの実行。
- 承認済みホストと実キーでのTurnstile確認、メール受付・受信箱への到達・返信先の確認。
- メール事業者やCloudflareの障害時、送信失敗時の利用者向け表示。
- 正式な事業者情報、連絡窓口、保存期間、外部委託先等を反映した法的表示。
- 実機での表示速度・操作・支援技術による確認。Lighthouse等の実測スコアは未記録。

APIの自動テストは実メールの到達確認ではありません。`npm run dev` と `npm run preview` はAstroの表示確認用で、Pages Functionsを実行しません。設定と結合確認は [お問い合わせの設定](contact-setup.md)、公開判断は [公開前チェックリスト](launch-checklist.md) に従ってください。
