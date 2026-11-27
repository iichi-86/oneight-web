import deployment from "./deployment.json";
import { contactBuildEnabled } from "./contact-release";

const origin = new URL(import.meta.env.PUBLIC_SITE_URL || deployment.siteUrl).origin;
const formatYen = (value: number) => new Intl.NumberFormat("ja-JP").format(value);
const developmentInitial = 0;
const developmentMonthly = 10000;
const databaseUpgradeMonthly = 3000;

// 確認済みの料金をページ間で共通化します。すべて税込です。
export const site = {
  name: "ONEIGHT",
  kana: "オンエイト",
  description: `ONEIGHTは地域の小さな小売店を主な対象に、Webサイト・Webアプリを制作し、導入までサポートします。基本料金は初期費用${formatYen(developmentInitial)}円・初月の基本月額0円、2か月目から月額${formatYen(developmentMonthly)}円。DBアップグレードは別途月額${formatYen(databaseUpgradeMonthly)}円、運用中の追加カスタマイズは別料金、不具合修正は無料です。すべて税込です。`,
  origin,
  allowIndexing: import.meta.env.PUBLIC_ALLOW_INDEXING === "true" && !!origin,
  contact: {
    enabled: contactBuildEnabled(import.meta.env.PUBLIC_CONTACT_ENABLED, origin, import.meta.env.CF_PAGES, import.meta.env.CF_PAGES_BRANCH),
    turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "",
  },
  pricing: {
    tax: "表示金額はすべて税込です。",
    hearing: "Webサイト・Webアプリの制作から導入まで。",
    development: {
      name: "Webサイト・アプリ開発",
      initialAmount: developmentInitial,
      initialLabel: formatYen(developmentInitial),
      monthlyAmount: developmentMonthly,
      monthlyLabel: formatYen(developmentMonthly),
      trialMonths: 1,
      firstMonthMonthlyAmount: 0,
      firstMonth: "初期費用・初月の基本月額料金ともに0円です。",
      priceMessage: "条件、追加費用なし。10000円のみ",
      basePriceScope: "基本のWebサイト・Webアプリ制作と導入の料金です。",
      storeOperation: "導入後の日々の運用は、店舗側で行っていただきます。",
      customization: "運用中の追加カスタマイズは別途費用がかかります。内容を確認し、事前にお見積もりします。",
      defectRepair: "制作したWebサイト・Webアプリに問題や不具合がある場合の修正は無料です。",
      monthlyStart: `まず1か月お試し。2か月目から月額${formatYen(developmentMonthly)}円です。`,
      scope: "制作する内容と導入までの対応範囲、お試しの開始日・継続や解約の方法は、利用前に確認します。",
      databaseUpgradeMonthlyAmount: databaseUpgradeMonthly,
      databaseUpgradeMonthlyLabel: formatYen(databaseUpgradeMonthly),
      upgradedMonthlyLabel: formatYen(developmentMonthly + databaseUpgradeMonthly),
      databaseUpgrade: `データベースのアップグレードは、別途月額${formatYen(databaseUpgradeMonthly)}円（税込）がかかります。`,
    },
  },
} as const;

export const navigation = [
  { href: "/service/", label: "サービス" },
  { href: "/pricing/", label: "料金" },
  { href: "/about/", label: "ONEIGHTについて" },
] as const;

export const faqs = [
  {
    question: `月額${formatYen(developmentMonthly)}円には、何が含まれますか？`,
    answer: `${site.pricing.development.basePriceScope} 初期費用0円、2か月目から月額${formatYen(developmentMonthly)}円（税込）です。DBアップグレードは別途月額${formatYen(databaseUpgradeMonthly)}円（税込）、運用中の追加カスタマイズは別料金です。制作したサイト・アプリの問題や不具合の修正は無料です。`,
  },
  {
    question: "Webサイト・アプリ開発の初月はいくらですか？",
    answer: `初期費用${formatYen(developmentInitial)}円、初月の基本月額料金も0円です。まず1か月お試しいただき、2か月目から月額${formatYen(developmentMonthly)}円（税込）がかかります。制作する内容や導入までの対応範囲、継続・解約の方法は、ご契約前に確認します。`,
  },
  {
    question: "データベースのアップグレードはいくらですか？",
    answer: `アップグレードを行う場合は、通常の月額${formatYen(developmentMonthly)}円とは別に月額${formatYen(databaseUpgradeMonthly)}円がかかります。2か月目以降の合計は月額${formatYen(developmentMonthly + databaseUpgradeMonthly)}円（税込）です。必要な内容と費用は、アップグレード前に一緒に確認します。`,
  },
  {
    question: "導入後の運用や修正は、どうなりますか？",
    answer: `${site.pricing.development.storeOperation} ${site.pricing.development.customization} ${site.pricing.development.defectRepair}`,
  },
  {
    question: "AIは、どのように活用しますか？",
    answer: "AIや共通の仕組みを活用して、制作の手間と費用を抑えます。必要な機能を確認し、動作を確かめながらWebサイト・Webアプリを制作します。",
  },
];
