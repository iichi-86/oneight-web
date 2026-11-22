import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
const routes = [
  "/",
  "/service/",
  "/pricing/",
  "/about/",
  "/contact/",
  "/privacy/",
];
const pages = [
  ...routes.map((route) => ({
    route,
    file: path.join(dist, route, "index.html"),
  })),
  { route: "/404.html", file: path.join(dist, "404.html") },
];
const errors = [];
const report = (message) => errors.push(message);
const env = {};
for (const filename of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
]) {
  try {
    Object.assign(
      env,
      parseEnv(await readFile(path.join(root, filename), "utf8")),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
Object.assign(env, process.env);

function publicOrigin(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const fake =
      /(^|\.)(?:example\.(?:com|net|org)|invalid|test|example|localhost)$/.test(
        url.hostname,
      ) ||
      /^(?:127\.|0\.0\.0\.0$)/.test(url.hostname) ||
      url.hostname === "[::1]";
    if (
      url.protocol !== "https:" ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      fake
    )
      throw new Error();
    return url.origin;
  } catch {
    report(
      "PUBLIC_SITE_URL: 実際の公開先のHTTPS originを指定してください。パス・クエリ・認証情報・仮ドメインは使用できません。",
    );
  }
}

const deployment = JSON.parse(
  await readFile(path.join(root, "src/data/deployment.json"), "utf8"),
);
const origin = publicOrigin(env.PUBLIC_SITE_URL || deployment.siteUrl);
const allowIndexing = env.PUBLIC_ALLOW_INDEXING === "true" && Boolean(origin);
const baseOrigin = origin || "https://build-verification.invalid";

function decode(value) {
  return value.replace(
    /&#(x[\da-f]+|\d+);|&(amp|quot|apos|lt|gt|nbsp);/gi,
    (_, code, entity) => {
      if (code)
        return String.fromCodePoint(
          code[0].toLowerCase() === "x"
            ? parseInt(code.slice(1), 16)
            : Number(code),
        );
      return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " }[
        entity.toLowerCase()
      ];
    },
  );
}

function attrs(tag) {
  const result = {};
  const attribute =
    /([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  attribute.lastIndex = tag.match(/^<\/?[^\s>]+/)?.[0].length || 0;
  for (let match; (match = attribute.exec(tag)); )
    result[match[1].toLowerCase()] = decode(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  return result;
}

const plainText = (html) =>
  decode(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
const documents = new Map();
const tagsIn = (html) =>
  [...html.matchAll(/<(?:[^>"']|"[^"]*"|'[^']*')+>/g)].map((match) => ({
    tag: match[0].match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase(),
    attrs: attrs(match[0]),
  }));

async function exists(filename) {
  try {
    return (await stat(filename)).isFile();
  } catch {
    return false;
  }
}

async function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  if (decoded.includes("\0")) return undefined;
  const filename = path.resolve(dist, `.${decoded}`);
  if (!filename.startsWith(`${dist}${path.sep}`) && filename !== dist)
    return undefined;
  for (const candidate of [
    filename,
    path.join(filename, "index.html"),
    `${filename}.html`,
  ])
    if (await exists(candidate)) return candidate;
}

async function htmlFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await htmlFiles(filename)));
    else if (entry.isFile() && entry.name.endsWith(".html"))
      result.push(filename);
  }
  return result;
}

async function checkReference(value, route, label, checkFragment = false) {
  if (!value) {
    report(`${route}: ${label}が空です。`);
    return;
  }
  if (/^javascript:/i.test(value)) {
    report(`${route}: ${label}にjavascript: URLがあります。`);
    return;
  }
  if (/^(?:data:|blob:|mailto:|tel:)/i.test(value)) return;
  let url;
  try {
    url = new URL(value, new URL(route, baseOrigin));
  } catch {
    report(`${route}: ${label}のURLが不正です (${value})。`);
    return;
  }
  if (!["https:", "http:"].includes(url.protocol) || url.origin !== baseOrigin)
    return;
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;
  const target = await resolveFile(url.pathname);
  if (!target) {
    report(`${route}: ${label}の参照先がありません (${value})。`);
    return;
  }
  if (checkFragment && url.hash && target.endsWith(".html")) {
    let id;
    try {
      id = decodeURIComponent(url.hash.slice(1));
    } catch {
      report(`${route}: ${label}のアンカーが不正です (${value})。`);
      return;
    }
    const html = documents.get(target) ?? (await readFile(target, "utf8"));
    if (!tagsIn(html).some(({ attrs: a }) => a.id === id))
      report(`${route}: ${label}のアンカーがありません (${value})。`);
  }
}

if (!(await exists(path.join(dist, "index.html")))) {
  console.error(
    "ビルド結果がありません。先に npm run build を実行してください。",
  );
  process.exit(1);
}
for (const filename of await htmlFiles(dist))
  documents.set(filename, await readFile(filename, "utf8"));

const unique = { title: new Map(), description: new Map(), h1: new Map() };
for (const { route, file } of pages) {
  const html = documents.get(file);
  if (!html) {
    report(`${route}: HTMLが生成されていません。`);
    continue;
  }
  const tags = tagsIn(html);
  const metadata = (name) =>
    tags
      .filter(
        ({ tag, attrs: a }) =>
          tag === "meta" &&
          (a.name?.toLowerCase() === name ||
            a.property?.toLowerCase() === name),
      )
      .map(({ attrs: a }) => a.content || "");
  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(
    (match) => plainText(match[1]),
  );
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(
    (match) => plainText(match[1]),
  );
  for (const [name, values] of Object.entries({
    title: titles,
    description: metadata("description").map(plainText),
    h1: headings,
  })) {
    if (values.length !== 1 || !values[0]) {
      report(`${route}: 空でない${name}を1つ設定してください。`);
      continue;
    }
    if (unique[name].has(values[0]))
      report(
        `${route}: ${name}が${unique[name].get(values[0])}と重複しています。`,
      );
    unique[name].set(values[0], route);
  }
  if (!/<html\b[^>]*\blang=["']ja(?:-JP)?["']/i.test(html))
    report(`${route}: 日本語のlang属性がありません。`);
  if (!metadata("viewport").some((value) => /width=device-width/.test(value)))
    report(`${route}: モバイル用viewportがありません。`);
  const robots = metadata("robots")
    .join(",")
    .toLowerCase()
    .split(/[\s,]+/);
  const shouldNoindex = route === "/404.html" || !allowIndexing;
  if (shouldNoindex && !robots.includes("noindex"))
    report(`${route}: 公開設定に応じたnoindexがありません。`);
  if (!shouldNoindex && (robots.includes("noindex") || robots.includes("none")))
    report(`${route}: 検索登録が有効ですがnoindexになっています。`);
  for (const property of [
    "og:title",
    "og:description",
    "og:type",
    ...(origin ? ["og:image"] : []),
  ])
    if (metadata(property).length !== 1 || !metadata(property)[0].trim())
      report(`${route}: ${property}を1つ設定してください。`);
  for (const value of metadata("og:image"))
    await checkReference(value, route, "og:image");
  const canonical = tags
    .filter(
      ({ tag, attrs: a }) =>
        tag === "link" && a.rel?.split(/\s+/).includes("canonical"),
    )
    .map(({ attrs: a }) => a.href);
  const expectedUrl = origin && new URL(route, origin).href;
  if (route === "/404.html") {
    if (canonical.length || metadata("og:url").length)
      report(`${route}: 404ページにはcanonical・og:urlを設定しません。`);
  } else if (origin) {
    if (canonical.length !== 1 || canonical[0] !== expectedUrl)
      report(`${route}: canonicalが公開URLと一致しません。`);
    if (
      metadata("og:url").length !== 1 ||
      metadata("og:url")[0] !== expectedUrl
    )
      report(`${route}: og:urlが公開URLと一致しません。`);
    for (const value of metadata("og:image"))
      if (!value.startsWith(`${origin}/`))
        report(`${route}: og:imageを公開URLの絶対URLにしてください。`);
  } else if (canonical.length || metadata("og:url").length)
    report(
      `${route}: 公開URL未設定時にcanonicalまたはog:urlを生成しています。`,
    );
  if (
    !tags.some(
      ({ tag, attrs: a }) =>
        tag === "link" && a.rel?.split(/\s+/).includes("icon") && a.href,
    )
  )
    report(`${route}: faviconの参照がありません。`);
}

for (const [filename, html] of documents) {
  const relative = path.relative(dist, filename).split(path.sep).join("/");
  const route = `/${relative === "index.html" ? "" : relative.replace(/index\.html$/, "")}`;
  for (const { tag, attrs: a } of tagsIn(html)) {
    for (const name of ["href", "src"])
      if (a[name] !== undefined)
        await checkReference(a[name], route, name, name === "href");
    if (tag === "img" && a.alt === undefined)
      report(`${route}: alt属性のない画像があります。`);
  }
}

// Check the deployed policy against exact generated bytes. Astro can inline small
// modules, so a successful build alone does not prove that the browser can run them.
try {
  const headers = await readFile(path.join(dist, "_headers"), "utf8");
  let section;
  const policies = [];
  for (const line of headers.split(/\r?\n/)) {
    if (/^\S/.test(line)) section = line.trim();
    else if (section === "/*") {
      const match = line.match(/^\s+Content-Security-Policy:\s*(.+)$/i);
      if (match) policies.push(match[1]);
    }
  }
  if (policies.length !== 1)
    report(
      "/_headers: 全ページへ適用するContent-Security-Policyを1つ設定してください。",
    );
  for (const policy of policies) {
    const directives = new Map();
    for (const directive of policy
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)) {
      const [name, ...sources] = directive.split(/\s+/);
      if (directives.has(name))
        report(`/_headers: CSPの${name}が重複しています。`);
      else directives.set(name, sources);
    }
    for (const [name, required] of Object.entries({
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://challenges.cloudflare.com"],
      "connect-src": ["'self'", "https://challenges.cloudflare.com"],
      "frame-src": ["https://challenges.cloudflare.com"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    })) {
      if (!required.every((value) => directives.get(name)?.includes(value)))
        report(`/_headers: CSPの${name}に必要な許可・制限がありません。`);
    }
    const scripts =
      directives.get("script-src-elem") ||
      directives.get("script-src") ||
      directives.get("default-src") ||
      [];
    if (
      !scripts.includes("'self'") ||
      !scripts.includes("https://challenges.cloudflare.com")
    )
      report("/_headers: script要素に自サイトとTurnstileを許可してください。");
    for (const name of ["script-src", "script-src-elem", "script-src-attr"]) {
      if (
        directives
          .get(name)
          ?.some((value) =>
            [
              "'unsafe-inline'",
              "'unsafe-eval'",
              "*",
              "data:",
              "https:",
            ].includes(value),
          )
      )
        report(
          `/_headers: CSPの${name}で任意のスクリプト実行を許可しています。`,
        );
    }
    for (const [filename, html] of documents) {
      const route = `/${path.relative(dist, filename).split(path.sep).join("/")}`;
      for (const match of html.matchAll(
        /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      )) {
        const a = attrs(`<script ${match[1]}>`);
        if (a.src !== undefined) {
          let url;
          try {
            url = new URL(a.src, new URL(route, baseOrigin));
          } catch {
            report(`${route}: scriptのURLが不正です。`);
            continue;
          }
          const permitted =
            (url.origin === baseOrigin && scripts.includes("'self'")) ||
            scripts.some((source) => source === url.origin);
          if (!permitted)
            report(
              `${route}: scriptの参照先がCSPで許可されていません (${a.src})。`,
            );
          await checkReference(a.src, route, "script src");
        } else if (match[2].trim()) {
          const permitted = ["sha256", "sha384", "sha512"].some((algorithm) =>
            scripts.includes(
              `'${algorithm}-${createHash(algorithm).update(match[2]).digest("base64")}'`,
            ),
          );
          if (!permitted)
            report(
              `${route}: 生成されたインラインscriptのハッシュがCSPにありません。`,
            );
        }
      }
      if (
        tagsIn(html).some(({ attrs: a }) =>
          Object.keys(a).some((name) => /^on[a-z]+$/.test(name)),
        )
      )
        report(
          `${route}: CSPで実行できないインラインイベントハンドラーがあります。`,
        );
    }
  }
} catch (error) {
  if (error.code === "ENOENT")
    report(
      "/_headers: 生成済みCSPがありません。npm run build を実行してください。",
    );
  else throw error;
}

for (const filename of [
  "favicon.svg",
  "images/social-card.png",
  "robots.txt",
  "sitemap.xml",
])
  if (!(await exists(path.join(dist, filename))))
    report(`/${filename}: ファイルがありません。`);

try {
  const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
  const disallowAll = /^\s*Disallow:\s*\/\s*$/im.test(robots);
  if (!/^\s*User-agent:\s*\*\s*$/im.test(robots))
    report("/robots.txt: User-agent: * がありません。");
  if (!allowIndexing && !disallowAll)
    report("/robots.txt: 公開前のクロール抑止がありません。");
  if (allowIndexing && disallowAll)
    report("/robots.txt: 検索登録が有効ですが全体をクロール禁止にしています。");
  const sitemapLines = [...robots.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)].map(
    (match) => match[1],
  );
  if (
    allowIndexing &&
    (sitemapLines.length !== 1 || sitemapLines[0] !== `${origin}/sitemap.xml`)
  )
    report("/robots.txt: sitemapのURLが公開URLと一致しません。");
  if (!allowIndexing && sitemapLines.length)
    report("/robots.txt: 検索登録を抑止している状態でsitemapのURLがあります。");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

try {
  const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
  if (
    !/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(
      sitemap,
    )
  )
    report("/sitemap.xml: sitemapのurlsetがありません。");
  const urls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) =>
    decode(match[1].trim()),
  );
  if (allowIndexing) {
    for (const route of routes)
      if (
        urls.filter((url) => url === new URL(route, origin).href).length !== 1
      )
        report(`/sitemap.xml: ${route}の公開URLを1つ含めてください。`);
    if (
      urls.some(
        (url) => !routes.some((route) => url === new URL(route, origin).href),
      )
    )
      report("/sitemap.xml: 対象外のURLが含まれています。");
  } else if (urls.length)
    report("/sitemap.xml: 検索登録を抑止している状態でURLが含まれています。");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (errors.length) {
  console.error(
    `生成物の検査に失敗しました（${errors.length}件）。\n${errors.map((message) => `- ${message}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `生成物の検査に成功しました。主要6ページ・404、内部参照、SEO・公開設定・CSPを確認しました（検索登録: ${allowIndexing ? "許可" : "抑止"}）。`,
  );
}
