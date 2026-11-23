import deployment from "./deployment.json";
import { contactBuildEnabled } from "./contact-release";

const origin = new URL(import.meta.env.PUBLIC_SITE_URL || deployment.siteUrl).origin;
const formatYen = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const developmentInitial = 14800;
const developmentMonthly = 20000;
const consultingFee = 100000;
const refundPercent = 70;
const refundAmount = consultingFee * refundPercent / 100;

// 確認済みの料金・返金条件をページ間で共通化します。すべて税込です。
export const site = {
  name: "ONE EIGHT",
  kana: "ワンエイト",
  description: "ONE EIGHTは地域のお店のWebサイト・アプリ制作と、製品づくりにつながる課題解決のコンサルを行います。制作は初期14,800円、初月の月額0円、2か月目から月額20,000円。コンサルはヒアリング無料、解決策の検討に進む時点で100,000円です。すべて税込。",
  origin,
  allowIndexing: import.meta.env.PUBLIC_ALLOW_INDEXING === "true" && !!origin,
  contact: {
    enabled: contactBuildEnabled(import.meta.env.PUBLIC_CONTACT_ENABLED, origin, import.meta.env.CF_PAGES, import.meta.env.CF_PAGES_BRANCH),
    turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "",
  },
  pricing: {
    tax: "表示金額はすべて税込です。",
    hearing: "ヒアリングは無料です。",
    development: {
      name: "Webサイト・アプリ開発",
      initialAmount: developmentInitial,
      initialLabel: formatYen(developmentInitial),
      monthlyAmount: developmentMonthly,
      monthlyLabel: formatYen(developmentMonthly),
      trialMonths: 1,
      firstMonthMonthlyAmount: 0,
      firstMonth: "初月は初期費用14,800円のみ。初月の月額料金は0円です。",
      monthlyStart: "まず1か月お試し。2か月目から月額20,000円です。",
      scope: "制作する内容と月額料金に含まれる対応範囲、お試しの開始日・継続や解約の方法は、ご契約前に確認します。",
    },
    consulting: {
      name: "課題解決のコンサル",
      feeAmount: consultingFee,
      feeLabel: formatYen(consultingFee),
      paymentTiming: "無料ヒアリングの後、解決策の検討に進む時点で100,000円をお支払いいただきます。",
      offering: "お店の困りごとを伺い、私たちの得意な製品をつくることで解決する方法を考え、提供につなげます。",
      scope: "100,000円に含む検討・制作・導入の範囲を確認してから、有料の検討へ進みます。",
      refund: {
        periodDays: 14,
        periodLabel: "製品の提供・納品日から2週間以内",
        percent: refundPercent,
        amount: refundAmount,
        amountLabel: formatYen(refundAmount),
        retainedAmount: consultingFee - refundAmount,
        retainedLabel: formatYen(consultingFee - refundAmount),
        summary: "製品の提供・納品日から2週間以内は、100,000円の70％（70,000円）を返金できます。",
        conditions: "返金の申出方法・適用条件、維持費の扱い、返金後の製品利用については、ご契約前に確認します。",
      },
      maintenance: "製品によって別途維持費がかかります。製品の改良・改善に充てる費用で、金額・支払頻度・対応範囲は事前にご案内します。",
    },
  },
} as const;

export const navigation = [
  { href: "/service/", label: "サービス" },
  { href: "/pricing/", label: "料金" },
  { href: "/about/", label: "ONE EIGHTについて" },
] as const;

export const faqs = [
  {
    question: "どちらのサービスを選べばいいですか？",
    answer: "Webサイトやアプリを作りたい方は「Webサイト・アプリ開発」、お店の困りごとから相談し、解決に役立つ製品を考えたい方は「課題解決のコンサル」をご覧ください。迷っている場合は、無料ヒアリングでお店の状況を聞かせてください。",
  },
  {
    question: "Webサイト・アプリ開発の初月はいくらですか？",
    answer: "初月は初期費用14,800円（税込）のみです。初月の月額料金は0円で、まず1か月お試しいただき、2か月目から月額20,000円（税込）がかかります。制作する内容や月額の対応範囲、継続・解約の方法は、ご契約前に確認します。",
  },
  {
    question: "コンサルは、どこから有料になりますか？",
    answer: "ヒアリングは無料です。その後、解決策の検討に進む時点で100,000円（税込）をお支払いいただきます。製品を提供した後や、成果が出た後に初めて料金が発生する方式ではありません。検討・制作・導入の範囲を先に確認してから進めます。",
  },
  {
    question: "コンサルでは、何をしてくれますか？",
    answer: "お店の困りごとを伺い、私たちの得意な製品をつくることで解決する方法を考え、提供につなげます。たとえば予約や受注、毎日の記録などが相談例です。対応できることや、料金に含む検討・制作・導入の範囲は、有料の検討に進む前に確認します。",
  },
  {
    question: "70％返金は、いつまで・いくらですか？",
    answer: "コンサルの製品提供・納品日から2週間以内は、100,000円（税込）の70％にあたる70,000円を返金できます。残りの30,000円は返金対象外です。返金の申出方法や適用条件、維持費の扱い、返金後の製品利用は、ご契約前に確認します。Webサイト・アプリ開発のお試しとは別の制度です。",
  },
  {
    question: "コンサルにも月額20,000円がかかりますか？",
    answer: "月額20,000円はWebサイト・アプリ開発の料金です。コンサルでは、製品によって別途維持費がかかります。維持費は製品の改良・改善に充て、金額・支払頻度・対応範囲を事前にご案内します。",
  },
  {
    question: "AIは、どのように活用しますか？",
    answer: "AIや共通の仕組みを活用して、制作の手間と費用を抑えます。お店の仕事の流れを聞き、必要な機能を選び、動作を確かめながら制作・改善を進めます。",
  },
];
