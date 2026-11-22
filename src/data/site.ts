import deployment from "./deployment.json";
import { contactBuildEnabled } from "./contact-release";

const origin = new URL(import.meta.env.PUBLIC_SITE_URL || deployment.siteUrl).origin;
const formatYen = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const maintenancePlans = [
  { id: "light", name: "ライト", monthlyAmount: 5000, summary: "基本保守・システム維持", services: ["基本保守", "システムの維持"] },
  { id: "standard", name: "スタンダード", monthlyAmount: 10000, summary: "保守・運用支援・軽微な修正", services: ["基本保守", "運用のサポート", "軽微な修正"] },
  { id: "premium", name: "プレミアム", monthlyAmount: 20000, summary: "分析と改善を、継続的に", services: ["基本保守・運用支援", "データ分析", "継続的な改善提案"] },
].map(plan => ({ ...plan, monthlyLabel: formatYen(plan.monthlyAmount) }));

// 料金と提供条件は各ページで共通の情報を参照します。
export const site = {
  name: "ONE EIGHT",
  kana: "ワンエイト",
  description: "お店の困りごとを、成功報酬で解決へ。ONE EIGHTは地域の個人店のWebサイト・アプリ・業務システムを制作し、一緒に運用します。相談・ご提案は無料、制作費の先払いは原則不要。事前に合意した条件を達成した時に固定報酬をいただきます。",
  origin,
  allowIndexing: import.meta.env.PUBLIC_ALLOW_INDEXING === "true" && !!origin,
  contact: {
    enabled: contactBuildEnabled(import.meta.env.PUBLIC_CONTACT_ENABLED, origin, import.meta.env.CF_PAGES, import.meta.env.CF_PAGES_BRANCH),
    turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "",
  },
  pricing: {
    projectRangeLabel: "3万〜20万円程度",
    projectMinimum: 30000,
    projectMaximum: 200000,
    tax: "表示金額はすべて税込です。",
    consultation: "ヒアリング・ご提案は無料です。",
    initialFee: "制作費の先払いは原則不要です。",
    settlement: "事前に合意した課題解決の達成条件を満たした時点で、固定報酬をお支払いいただきます。",
    conditions: "課題の難易度・経済的価値・開発工数に応じて、達成条件・固定報酬額・実施期間を着手前に合意します。",
    monthlyStart: "月額料金は原則として、課題解決後の継続契約から発生します。",
    contract: "保守・運用支援・軽微な修正の具体的な対応範囲、契約期間、解約条件は、ご契約前に確認します。",
    payment: "支払方法・支払期限、条件未達・中断・期間延長が生じた場合の扱いも、着手前に確認します。",
    extra: "大規模な追加開発や、新たな課題の解決は別途お見積もりします。外部サービス利用料などの負担も、事前に確認します。",
    plans: maintenancePlans,
  },
} as const;

export const navigation = [
  { href: "/service/", label: "サービス" },
  { href: "/pricing/", label: "料金" },
  { href: "/about/", label: "ONE EIGHTについて" },
] as const;

export const faqs = [
  {
    question: "課題が整理できていなくても、相談できますか？",
    answer: "はい。ヒアリング・ご提案は無料です。「手作業に時間がかかる」「お客様に情報が届かない」など、日々の困りごとからお聞かせください。課題を整理し、取り組む範囲と解決方法を一緒に考えます。",
  },
  {
    question: "どんなものを開発できますか？",
    answer: "店舗専用のWebサイト・Webアプリ・業務システムを、課題に応じて検討します。会員サービスや、お知らせ、予約・受注・情報管理などは相談例です。必要性と実現可能性を確認し、対応する機能を個別にご提案します。",
  },
  {
    question: "成功報酬はいくらですか？",
    answer: "目安は税込3万〜20万円程度です。課題の内容や必要な制作を確認し、金額を先に決めます。合意した条件を達成した時にお支払いいただく固定報酬で、売上の何％という方式ではありません。制作費の先払いは原則不要です。",
  },
  {
    question: "何をもって「解決」とするのですか？",
    answer: "制作を始める前に、「どうなれば解決と言えるか」を一緒に決めます。確認するデータや測り方、取り組む期間、お店にお願いする準備も整理し、その条件に沿って結果を確かめます。",
  },
  {
    question: "月額料金は、いつからかかりますか？",
    answer: "原則として、課題解決後の継続契約から発生します。税込月額5,000円・10,000円・20,000円の3プランをご用意し、必要な保守・運用支援の範囲に合わせてご相談します。大規模な追加開発や新たな課題は別途お見積もりします。",
  },
  {
    question: "期間内に解決しなかったら、どうなりますか？",
    answer: "条件を満たさない場合や、中断・延長が必要になった場合の対応と費用は、始める前に確認します。途中で新しい課題や追加の開発が必要になった時は、内容と費用をあらためてご相談します。",
  },
  {
    question: "AIは、どのように活用しますか？",
    answer: "AIや共通の仕組みを活用して、制作の手間と費用を抑えます。お店の仕事の流れを聞き、必要な機能を選び、動作を確かめながら制作・改善を進めます。",
  },
];
