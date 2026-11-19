// 料金・未確定条件・公開状態はここでまとめて管理します。
const monthlyAmount = 20000;
const monthlyLabel = new Intl.NumberFormat("ja-JP").format(monthlyAmount);
export const site = {
  name: "oneight",
  kana: "ワンエイト",
  description:
    "お店らしい会員サービスを、もっと身近に。oneightは地域の個人店舗・小規模事業者に向けた、専用Webアプリの制作・運用サービスを準備しています。",
  origin: import.meta.env.PUBLIC_SITE_URL
    ? new URL(import.meta.env.PUBLIC_SITE_URL).origin
    : undefined,
  allowIndexing:
    import.meta.env.PUBLIC_ALLOW_INDEXING === "true" &&
    !!import.meta.env.PUBLIC_SITE_URL,
  contact: {
    enabled: import.meta.env.PUBLIC_CONTACT_ENABLED === "true",
    turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "",
  },
  pricing: {
    monthlyAmount,
    monthlyLabel,
    status: "提供予定価格",
    initialFee: "標準プランで初期制作費0円を目指して準備中",
    tax: "税込・税抜の区分は未確定です。",
    conditions:
      "料金・契約期間・提供機能は検討中です。正式な条件は、ご提案時に個別にご案内します。",
    contract:
      "最低利用期間、更新方法、解約手続きなどは検討中です。ご契約前に確認できる形でお伝えします。",
    payment:
      "お支払い方法や請求時期も含め、正式な条件はご提案時にご案内する予定です。",
    extra:
      "標準範囲を超える機能・外部サービス利用料などは、必要性を確認したうえで個別にご案内する予定です。",
  },
} as const;

export const navigation = [
  { href: "/service/", label: "サービス" },
  { href: "/pricing/", label: "料金" },
  { href: "/about/", label: "oneightについて" },
] as const;

export const faqs = [
  {
    question: "専門知識がなくても相談できますか？",
    answer:
      "はい。まずは、お店のことや日々のお困りごとをお聞かせください。導入後の使い方や運用方法も含め、わかりやすいご案内を目指しています。具体的なサポート範囲はご提案時にお伝えします。",
  },
  {
    question: "スマートフォンで使えますか？",
    answer:
      "スマートフォンのブラウザから利用できるWebアプリを想定しています。ホーム画面への追加にも対応を目指します。使える機能は端末・OS・ブラウザによって異なる場合があります。",
  },
  {
    question: "App Storeへの登録は必要ですか？",
    answer:
      "想定しているWebアプリは、URLやQRコードからアクセスするため、App Storeへの登録・掲載を前提としていません。アプリストアを通じた配信をご希望の場合は、別途ご相談ください。",
  },
  {
    question: "お店に合わせてデザインを変えられますか？",
    answer:
      "お店のロゴや色、雰囲気を反映したデザインを目指しています。共通システムを土台にするため、ご希望の表現や対応範囲はヒアリングで確認します。",
  },
  {
    question: "LINE公式アカウントと併用できますか？",
    answer:
      "併用を想定したご相談が可能です。LINEでの情報発信と、お店専用の会員サービスなど、それぞれの使い方を一緒に整理します。個別のシステム連携は別途検討となります。",
  },
  {
    question: "料金や契約期間はどうなりますか？",
    answer: `基本プランは月額${site.pricing.monthlyLabel}円を想定しています。${site.pricing.tax}${site.pricing.conditions}`,
  },
  {
    question: "導入までにどれくらいかかりますか？",
    answer:
      "現在はサービスを準備している段階のため、一律の納期は設けていません。ご希望の機能や準備状況を確認し、スケジュールをご相談します。",
  },
];
