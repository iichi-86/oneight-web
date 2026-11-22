# お問い合わせ受付の設定

フォームとCloudflare Pages Function `/api/contact` を実装済みです。所有者がCloudflare Pagesを公開し、独自ドメイン `https://oneight.jp` のHTTPS表示を確認しています。ResendのSecret登録も所有者の報告・画面で確認しました。送信ドメイン認証、Turnstile、プライバシー情報の確定と実メール送信の確認は未完了のため、画面は「受付準備中」、送信は無効のままです。Secretの登録だけでは送信成功を確認したことにはなりません。

## 採用する最小構成

- Astroは静的HTMLを配信します。Cloudflare Pagesのルート直下の `functions/api/contact.ts` が送信だけを処理します。`dist` のみの手動静的アップロードではFunctionsが含まれないため、リポジトリ連携によるPagesビルド、またはリポジトリルートからのWrangler Pagesデプロイを利用します。
- Cloudflare Turnstileで自動送信を確認した後、ResendのHTTP APIで指定した運営者のメールアドレスへ転送します。返信先はフォームに入力されたアドレスです。自動返信メールは送りません。
- 専用データベース、問い合わせ一覧管理画面、ログへの問い合わせ内容の出力は実装していません。Resendおよび受信用メールサービスに内容が処理・保存されるため、両者の保持設定とアクセス管理が必要です。

## 受付開始前に承認・設定すること

1. 既存のCloudflare Pagesと正式ドメイン `oneight.jp` を使用します。Turnstile・Resend・受付用メールサービスの利用条件と料金、送信ドメイン認証の設定を確認します。追加のDNS変更、外部契約・課金、秘密情報の設定は所有者の確認済み範囲で行います。
2. Resendで送信ドメインを検証します。送信元・送信先には実在するメールアドレスを設定します。`CONTACT_FROM_EMAIL` は検証済みドメインのメールアドレスそのものを指定します（表示名付き形式は未対応）。
3. Turnstileで許可ホストを正式ドメインに制限し、サイトキーと秘密キーを発行します。テスト用キーを本番に流用しないでください。検証時にhostnameおよびaction=`contact`も照合します。
4. Pages Functionsの**実行時**に、下表の非公開変数を設定します。PreviewとProductionで分離します。Cloudflareのビルド用変数だけを設定しても実行時に引き継がれない場合があるため、Functionsの実際のバインディングを確認してください。
5. 正式な事業者情報、別経路の連絡窓口、保存期間、外部サービスの利用条件・処理地域等を確認し、`src/pages/privacy.astro`の確認用表示を確定します。フォーム以外の個人情報照会窓口が必要です。
6. 受付用ビルド変数を設定して再ビルドし、承認された検証環境で有効なTurnstileと実メールの受信・返信先・失敗時表示を確認します。その後、所有者が本番での受付開始を承認します。

| 変数 | 設定場所 | 内容 |
| --- | --- | --- |
| `PUBLIC_CONTACT_ENABLED` | Astroビルド | 全設定確認後に `true`。未設定・falseなら送信不可 |
| `PUBLIC_TURNSTILE_SITE_KEY` | Astroビルド | Turnstileの公開サイトキー |
| `PUBLIC_SITE_URL` | Astroビルド | 任意の上書き。未設定時は `src/data/deployment.json` の `https://oneight.jp` を使用 |
| `CONTACT_ENABLED` | Functions実行時 | 受信許可時に `true` |
| `CONTACT_ALLOWED_ORIGIN` | Functions実行時 | 本番では `https://oneight.jp`。実際のリクエストoriginと完全一致させる |
| `RESEND_API_KEY` | Functions実行時の秘密変数 | 送信専用・必要最小権限のAPIキー |
| `CONTACT_FROM_EMAIL` | Functions実行時 | 認証済み送信元メールアドレス |
| `CONTACT_TO_EMAIL` | Functions実行時 | 問い合わせ受信用メールアドレス |
| `TURNSTILE_SECRET_KEY` | Functions実行時の秘密変数 | Turnstileの秘密キー |

本番だけでなく、プレビューでフォームを有効にする場合も、そのプレビューのoriginを実行時設定に指定し、Turnstileの許可ホストも整合させます。未承認のプレビューで個人情報を取得しないでください。

## セキュリティ・運用上の動作

- POSTかつJSONのみ。Originヘッダー・実リクエストorigin・許可originの完全一致を必須にし、CORS許可ヘッダーは返しません。
- 最大16KiB、文字数・形式・選択肢・同意をサーバーでも検証。ストリームの実サイズも確認します。メールはプレーンテキストで送信します。
- 空のhoneypot、2.5秒以上の入力時間、Turnstileの成功・hostname・action照合を必須にします。長時間開いたフォームも新しいTurnstile確認後に送信できるよう、入力時間に上限は設けません。確認トークンの有効期限・再利用可否はTurnstile側で検証されます。入力時間・honeypotだけで高度な攻撃を防ぐことはできないため、Turnstileを無効化する回避設定はありません。
- 検証APIは8秒、メールAPIは10秒で中断。メール配信事業者がID付きで受付を返した場合にだけ成功とします。受信箱への最終到達の保証ではありません。
- 同じ入力の再試行には同じUUIDのIdempotency-KeyをResendへ渡します。プロバイダーの有効期間内（現在の仕様を確認）で重複受付を抑制します。ページ再読込や別ブラウザにまたがる重複は防げません。
- 通信失敗時は入力内容を消しません。ブラウザ内の下書き永続保存はせず、成功時にフォームを初期化します。
- 公開時はCloudflare側の適切な送信レート制限・WAF等も検討し、API使用量や不達を監視します。送信履歴の永続監視・レート制限用データベースは本実装の範囲外です。
- `_headers`のCSPは `https://challenges.cloudflare.com` のscript-src・frame-src・connect-srcと自サイトのスクリプトを許可する必要があります。

## 検証

`npm test` は未設定、送信元偽装、必須項目、本文サイズ、スパム条件、Turnstile失敗、メールAPI失敗、受付成功・重複抑止キーをモックで検証します。実キー・実メールは使いません。

Pages Functionsの結合確認では、Cloudflare公式Wranglerで `npx wrangler pages dev dist` を**リポジトリルートで**実行し、`.dev.vars`でローカル実行時変数を設定します。Astroの `npm run dev` / `npm run preview` はPages Functionを実行しません。両環境の違いを送信成功と混同しないでください。
