# お問い合わせ受付の設定

フォームとCloudflare Pages Function `/api/contact` を実装しています。2026年11月28日の送信障害では、Turnstileの秘密キー設定の拒否を特定し、所有者がTurnstile・Resendの本番キーを設定し直しました。再デプロイ後、エージェントが所有者の明示許可を得て[公開フォーム](https://oneight.jp/contact/)から最終テストを1回送信し、成功表示と入力欄の初期化を確認しました。所有者も設定済みGmailへの到着を確認しています。秘密キーの値と受信箱の内容はエージェントに共有していません。詳細な経緯・検証範囲は下記と[検証記録](validation.md)を参照してください。

## 採用する最小構成

- Astroは静的HTMLを配信します。Cloudflare Pagesのルート直下の `functions/api/contact.ts` が送信だけを処理します。`dist` のみの手動静的アップロードではFunctionsが含まれないため、リポジトリ連携によるPagesビルド、またはリポジトリルートからのWrangler Pagesデプロイを利用します。
- Cloudflare Turnstileで自動送信を確認した後、ResendのHTTP APIで指定した運営者のメールアドレスへ転送します。返信先はフォームに入力されたアドレスです。自動返信メールは送りません。
- 専用データベース、問い合わせ一覧管理画面、ログへの問い合わせ内容の出力は実装していません。Resendおよび受信用メールサービスに内容が処理・保存されるため、両者の保持設定とアクセス管理が必要です。

## 設定と運用確認

1. 既存のCloudflare Pagesと正式ドメイン `oneight.jp` を使用します。Turnstile・Resend・受付用メールサービスの利用条件と料金、送信ドメイン認証の設定を確認します。追加のDNS変更、外部契約・課金、秘密情報の設定は所有者の確認済み範囲で行います。
2. Resendの送信ドメインVerifiedと実メールのGmail到達は所有者の報告で確認済みです。`CONTACT_FROM_EMAIL` は検証済みドメインのメールアドレスそのものを使用します（表示名付き形式は未対応）。プロバイダログ・返信先の確認は未実施です。
3. Turnstileで許可ホストを正式ドメインに制限し、サイトキーと秘密キーを設定します。公開画面では実際の公開site keyによるSuccess表示を確認済みです。サーバーのSiteverifyは、問い合わせの実送信時にhostnameおよびaction=`contact`も照合します。所有者の実送信到達報告はありますが、エージェントによるプロバイダログの確認は行っていません。
4. Pages Functionsの**実行時**に、下表の非公開変数を設定します。PreviewとProductionで分離します。Cloudflareのビルド用変数だけを設定しても実行時に引き継がれない場合があるため、Functionsの実際のバインディングを確認してください。
5. `src/pages/privacy.astro` に運営者・フォーム以外の連絡窓口・保存と削除の方針・利用サービスを反映しています。運営やサービスの構成が変わった際も、実際の取り扱いに合わせて更新します。
6. 所有者の指示に基づく有効化変更は公開反映済みで、Gmail到達は本人報告で確認済みです。返信先・失敗時表示は引き続き未確認です。エージェントの画面確認と、所有者の送信・受信報告を区別して記録します。

| 変数 | 設定場所 | 内容 |
| --- | --- | --- |
| `PUBLIC_CONTACT_ENABLED` | Astroビルド | 任意の上書き。未設定なら下記の承認済みリリース判定。`true`以外の明示値は停止 |
| `PUBLIC_TURNSTILE_SITE_KEY` | Astroビルド | Turnstileの公開サイトキー |
| `PUBLIC_SITE_URL` | Astroビルド | 任意の上書き。未設定時は `src/data/deployment.json` の `https://oneight.jp` を使用 |
| `CONTACT_ENABLED` | Functions実行時 | 任意の上書き。未設定なら下記の本番origin判定。`true`以外の明示値は停止 |
| `CONTACT_ALLOWED_ORIGIN` | Functions実行時 | 本番では `https://oneight.jp`。実際のリクエストoriginと完全一致させる |
| `RESEND_API_KEY` | Functions実行時の秘密変数 | 送信専用・必要最小権限のAPIキー |
| `CONTACT_FROM_EMAIL` | Functions実行時 | 認証済み送信元メールアドレス |
| `CONTACT_TO_EMAIL` | Functions実行時 | 問い合わせ受信用メールアドレス |
| `TURNSTILE_SECRET_KEY` | Functions実行時の秘密変数 | Turnstileの秘密キー |

本番だけでなく、プレビューでフォームを有効にする場合も、そのプレビューのoriginを実行時設定に指定し、Turnstileの許可ホストも整合させます。未承認のプレビューで個人情報を取得しないでください。

### 承認済みリリースと停止方法

所有者が登録したと報告した7件は `NODE_VERSION`、`RESEND_API_KEY`、`PUBLIC_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`CONTACT_ALLOWED_ORIGIN`、`CONTACT_FROM_EMAIL`、`CONTACT_TO_EMAIL` です。値はこの文書へ記載しません。`PUBLIC_CONTACT_ENABLED`・`CONTACT_ENABLED` を追加で手入力する必要はありません。

`src/data/contact-release.ts` に定義した有効化状態・公式origin・本番ブランチ `feat/oneight-official-site` を承認済みの公開設定として使用します。Pages内蔵Wrangler 3系との互換性のため、FunctionsからJSONのimport属性を参照しません。フラグが**未設定の場合にだけ**、同ファイルの共有判定が次の条件で有効化します。

- 画面：公式origin `https://oneight.jp`、`CF_PAGES=1`、`CF_PAGES_BRANCH` が本番ブランチと一致するビルド。公開Turnstileキーも必要です。
- API：許可originとリクエストoriginが、ともに公式originと一致。APIキー・送信元・送信先・Turnstile secret key等の必須設定が不足する場合は、従来どおり503で停止します。

明示的な `false`・空文字・未知の値は停止します。ローカル用 `.env.example` の停止設定はそのまま使用できます。本番ブランチを変更したら、`src/data/contact-release.ts` の本番ブランチ設定も更新してください。公式ドメイン変更時は、同ファイルの公式originと、canonical用の `src/data/deployment.json` の両方を一致させます。

運用停止時はProductionの `PUBLIC_CONTACT_ENABLED=false` と `CONTACT_ENABLED=false` を設定し、再ビルド・再デプロイします。再開時に承認済みリリース判定へ戻す場合は、両上書き変数を削除して未設定に戻し、再ビルド・再デプロイしてください。空文字への変更では停止が続きます。

## フォームの入力項目

利用者が入力する必須項目は返信用メールアドレス、空白以外の相談内容（1〜4,000文字）、個人情報の取り扱いへの同意です。名前・店舗名／教室名・業種は任意で、省略や空欄を受け付けます。入力された任意項目は型・文字数・制御文字・業種の許可値を検証し、メール本文の空欄は「未入力」と表示します。

任意欄は折りたたんで表示し、任意項目にエラーがある場合は開いて案内します。サービス選択は必須にしません。送信前の不正利用対策に必要なtoken・時刻・UUID・空のhoneypotは、任意項目化とは別に従来どおり必須です。

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

### 2026年11月28日の送信障害

本番フォームでTurnstileのSuccess表示後に送信しても、「送信の受付を確認できませんでした。時間をおいて再度お試しください。」となる事象を、所有者が許可した1回の送信操作で再現しました。メールの受付・到達は未確認です。この試行とは別に、実メールへ進まない負の検査で、空JSONと空トークンは422 JSON、形式を満たす無効トークンは502平文を返すことを確認しています。

現行APIの明示的な失敗応答はすべてJSONです。したがって502平文だけでは、Turnstile・Resend・Cloudflareのどこで失敗したかは確定できません。ローカルのPagesルータ・workerdとモック上流では各失敗がJSONになることを確認しており、この結果を本番復旧や実メール到達の証明には使いません。既存Cloudflareプロジェクトの実行ログで、該当リクエストの実行有無・失敗箇所を確認してください。追加の本番送信は、最初の試行で実際に受付済みだった可能性も考慮して行います。

所有者が提示した本番実行ログでは、該当リクエストの `outcome=ok`、応答502、例外・ログとも空であることを確認しました。実行時間は8msです。旧互換日付を含むローカルworkerdでは、SiteverifyのHTTP400だけでも同程度の時間でアプリの502応答になるため、実行時間だけでJavaScript例外や設定不良を断定しません。

診断の改善として、外部サービスの不調は503 JSON、認証結果の拒否は従来どおり422 JSONで返します。送信成功には引き続きTurnstileのhostname・action一致とResendの受付IDが必要です。外部処理の失敗時だけ、固定の `stage`・`code`、検証済みUUIDの `requestId`、取得できた有効な数値 `httpStatus` をログと応答の `diagnostic` に出します。本文・名前・メールアドレス・秘密キー・トークン・IP・プロバイダの生レスポンス・例外の内容は記録も返却もしません。この変更の検証と、本番の送信経路の復旧確認は区別します。

本番コミット `d266053` のPagesデプロイ `c7336e8f-e34e-4e94-9e0f-e93184965447` 成功後、無効トークンの負の検査で503 JSON、`stage=turnstile_response`、`code=upstream_http_error`、`httpStatus=400` を確認しました。メール配信より前のSiteverifyが拒否している状態です。400の応答に既知の `invalid-input-secret` または `missing-input-secret` が含まれる場合だけ、固定分類 `verification_configuration_error` へ変換します。他のエラーコードや生レスポンスは返却しません。これにより既存の `TURNSTILE_SECRET_KEY` の設定を確認すべき状態を、安全に区別します。

続く本番コミット `5bdeba0` の負の検査で `verification_configuration_error` を確認し、秘密キーの設定が認証サービスに拒否されていることを特定しました。コピー時の前後の空白・改行で正しいキーが使えなくなる場合に対応するため、`TURNSTILE_SECRET_KEY` と `RESEND_API_KEY` は前後の空白だけを除去して使用します。空白だけの値・文字列以外の値は、外部通信前に503で停止します。許可originとメールアドレスの厳密な検証は維持します。除去後も同じ設定エラーが続く場合は、公開フォームと同じSite keyに対応する既存TurnstileウィジェットのSecret keyを、Productionの `TURNSTILE_SECRET_KEY` に正しく設定し直す必要があります。秘密キーをチャットやGitへ貼り付けず、所有者の管理画面内で扱います。

### 復旧確認

所有者が既存の `oneight-contact` ウィジェットのSecret keyを保存し、`8bc447a` の再デプロイ後にSiteverifyの設定エラーが解消しました。その後の実フォーム試行でResendの受付失敗が判明したため、所有者が新しい送信用APIキーを作成し、Productionの `RESEND_API_KEY` を更新しました。キーの値はエージェントへ共有していません。

同じアプリコードの空コミット `15831798fad064a89834dce328f6735ae1030e99` で再デプロイし、Pagesデプロイ `19f9c14e-4a32-4e5f-adc4-85433a5f757f` の成功を確認しました。公開ページはHTTP200・フォーム有効、不正トークンの負の検査は想定どおり422 JSONです。最終実フォームテストは所有者が改めて許可し、送信成功表示・入力初期化・送信ボタン復帰を確認。続いて所有者がGmailへの到着を確認しました。これを実送信の復旧確認とし、30件のモックテストの成功とは区別します。

`npm test` は未設定、送信元偽装、必須項目、本文サイズ、スパム条件、Turnstile失敗、メールAPI失敗、受付成功・重複抑止キーをモックで検証します。実キー・実メールは使いません。

Pages Functionsの結合確認では、Cloudflare公式Wranglerで `npx wrangler pages dev dist` を**リポジトリルートで**実行し、`.dev.vars`でローカル実行時変数を設定します。Astroの `npm run dev` / `npm run preview` はPages Functionを実行しません。両環境の違いを送信成功と混同しないでください。
