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
  description: "ONE EIGHTは地域の個人店の課題を無料でヒアリングし、AIを活用した専用Webサイト・アプリ・業務システムの開発から運用・改善まで一緒に取り組みます。事前に合意した条件達成時の固定報酬と、解決後の月額保守をご案内します。",
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
    question: "課題解決時の報酬は、どう決まりますか？",
    answer: "目安は税込3万〜20万円程度です。難易度・経済的価値・開発工数を踏まえて固定金額を事前に合意し、合意した達成条件を満たした時点でお支払いいただく方式です。売上に対する歩合報酬ではありません。制作費の先払いは原則不要です。",
  },
  {
    question: "「課題が解決した」は、どう確認しますか？",
    answer: "取り組む課題、達成条件、確認するデータや測定方法、実施期間を着手前に一緒に決めます。店舗側にお願いする準備や運用も確認し、合意した条件に沿って達成状況を確かめます。",
  },
  {
    question: "月額料金は、いつからかかりますか？",
    answer: "原則として、課題解決後の継続契約から発生します。税込月額5,000円・10,000円・20,000円の3プランをご用意し、必要な保守・運用支援の範囲に合わせてご相談します。大規模な追加開発や新たな課題は別途お見積もりします。",
  },
  {
    question: "条件に届かない場合や、途中で変更が必要な場合は？",
    answer: "条件未達、実施期間の延長、中断、店舗の状況変更が起きた場合の対応や費用の扱いは、着手前に確認します。途中で新たな課題や追加開発が必要になった場合は、対応範囲と費用をあらためてご相談します。",
  },
  {
    question: "AIは、どのように活用しますか？",
    answer: "開発の補助にAIを活用し、共通の仕組みを活かして制作にかかる費用と時間の無駄を抑えます。お店の業務を理解し、必要な仕組みを選び、動作を確認しながら運用・改善に取り組みます。",
  },
];
