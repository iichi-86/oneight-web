import { contactRuntimeEnabled } from '../../src/data/contact-release.ts';
import { industryLabels } from '../../src/data/industries.ts';

/** Cloudflare Pages Function. No secrets or inquiry contents are logged. */
export interface ContactEnv {
  CONTACT_ENABLED?: string;
  CONTACT_ALLOWED_ORIGIN?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface Context {
  request: Request;
  env: ContactEnv;
}
type Fetch = typeof fetch;
const MAX_BYTES = 16_384;
const industries = new Set(Object.keys(industryLabels));
const emailPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeliveryStage = 'turnstile_fetch' | 'turnstile_response' | 'resend_fetch' | 'resend_response';
type DeliveryFailureCode = 'upstream_http_error' | 'verification_configuration_error' | 'verification_rejected' | 'invalid_json' | 'invalid_receipt' | 'upstream_exception';

function deliveryFailure(status: 422 | 503, message: string, requestId: string, stage: DeliveryStage, code: DeliveryFailureCode, httpStatus?: number): Response {
  // Only a previously validated UUID and fixed diagnostic fields may be logged.
  // Never pass request data, provider bodies, headers or caught errors here.
  const entry: { event: string; requestId: string; stage: DeliveryStage; code: DeliveryFailureCode; httpStatus?: number } = {
    event: 'contact_delivery_failure', requestId, stage, code,
  };
  if (httpStatus !== undefined && Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) {
    entry.httpStatus = httpStatus;
  }
  console.error(JSON.stringify(entry));
  const { event: _event, ...diagnostic } = entry;
  return json(status, message, { diagnostic });
}

function json(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  return new Response(
    JSON.stringify({ ok: status === 200, message, ...extra }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      },
    },
  );
}

function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    !/[\r\n]/.test(value) &&
    emailPattern.test(value)
  );
}

function optionalShortText(value: unknown, max: number): boolean {
  return value === undefined || (
    typeof value === "string" &&
    value.trim().length <= max &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

async function readJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES)
    throw new RangeError("body");
  if (!request.body) throw new SyntaxError("body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new RangeError("body");
    }
    chunks.push(chunk.value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}

async function upstream(
  fetcher: Fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return fetcher(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetcher: Fetch = fetch,
  now = Date.now(),
): Promise<Response> {
  if (request.method !== "POST") {
    const result = json(405, "この送信方法には対応していません。");
    result.headers.set("Allow", "POST");
    return result;
  }
  const origin = new URL(request.url).origin;
  // Provider keys do not contain whitespace; tolerate surrounding copy/paste whitespace.
  const resendApiKey = typeof env.RESEND_API_KEY === 'string' ? env.RESEND_API_KEY.trim() : '';
  const turnstileSecretKey = typeof env.TURNSTILE_SECRET_KEY === 'string' ? env.TURNSTILE_SECRET_KEY.trim() : '';
  if (
    !contactRuntimeEnabled(env.CONTACT_ENABLED, env.CONTACT_ALLOWED_ORIGIN, origin) ||
    !env.CONTACT_ALLOWED_ORIGIN ||
    !resendApiKey ||
    !turnstileSecretKey ||
    !validEmail(env.CONTACT_TO_EMAIL) ||
    !validEmail(env.CONTACT_FROM_EMAIL)
  ) {
    return json(
      503,
      "現在、お問い合わせフォームの受付準備中です。入力内容は送信されていません。",
    );
  }
  // Both values are required. Forwarded headers and user-supplied form origins are never trusted.
  if (
    origin !== env.CONTACT_ALLOWED_ORIGIN ||
    request.headers.get("origin") !== origin
  ) {
    return json(403, "ページを開き直してから、もう一度お試しください。");
  }
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    return json(
      415,
      "送信形式を確認できませんでした。ページを開き直してください。",
    );
  let input: unknown;
  try {
    input = await readJson(request);
  } catch (error) {
    return json(
      error instanceof RangeError ? 413 : 400,
      "入力内容が長すぎるか、送信内容を確認できませんでした。",
    );
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return json(400, "入力内容を確認してください。");
  const data = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (!optionalShortText(data.name, 100))
    errors.name = "お名前を100文字以内で入力してください。";
  if (!optionalShortText(data.shop, 150))
    errors.shop = "店舗名・教室名を150文字以内で入力してください。";
  if (!validEmail(data.email))
    errors.email = "有効なメールアドレスを入力してください。";
  if (data.industry !== undefined && (typeof data.industry !== "string" || (data.industry !== "" && !industries.has(data.industry))))
    errors.industry = "業種を選択肢から選んでください。";
  if (
    typeof data.message !== "string" ||
    data.message.trim().length < 1 ||
    data.message.length > 4000 ||
    /[\u0000\u000b\u000c]/.test(data.message)
  )
    errors.message = "相談内容を1〜4,000文字で入力してください。";
  if (data.consent !== true)
    errors.consent = "個人情報の取り扱いへの同意が必要です。";
  if (Object.keys(errors).length)
    return json(422, "入力内容をご確認ください。", { errors });
  if (
    typeof data.website !== "string" ||
    data.website !== "" ||
    typeof data.startedAt !== "number" ||
    !Number.isFinite(data.startedAt) ||
    now - data.startedAt < 2500
  ) {
    return json(
      400,
      "送信内容を確認できませんでした。少し時間をおいてからお試しください。",
    );
  }
  if (typeof data.requestId !== "string" || !uuidPattern.test(data.requestId))
    return json(400, "ページを開き直してからお試しください。");
  if (
    typeof data.token !== "string" ||
    data.token.length < 1 ||
    data.token.length > 2048
  )
    return json(422, "送信前の確認を完了してください。");

  let stage: DeliveryStage = 'turnstile_fetch';
  let upstreamStatus: number | undefined;
  const requestId = data.requestId;
  try {
    const challenge = new URLSearchParams({
      secret: turnstileSecretKey,
      response: data.token,
    });
    const remoteIp = request.headers.get("cf-connecting-ip");
    if (remoteIp) challenge.set("remoteip", remoteIp);
    const verification = await upstream(
      fetcher,
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: challenge },
      8000,
    );
    stage = 'turnstile_response';
    upstreamStatus = verification.status;
    if (!verification.ok) {
      let code: DeliveryFailureCode = 'upstream_http_error';
      if (verification.status === 400) {
        try {
          const failure: unknown = await verification.json();
          if (failure && typeof failure === 'object' && 'error-codes' in failure) {
            const codes = failure['error-codes'];
            if (Array.isArray(codes) && codes.some(value => value === 'invalid-input-secret' || value === 'missing-input-secret')) {
              code = 'verification_configuration_error';
            }
          }
        } catch {
          // Keep the HTTP failure classification; never expose the provider body.
        }
      }
      return deliveryFailure(
        503,
        "確認サービスに接続できませんでした。少し時間をおいて再度お試しください。",
        requestId, stage, code, upstreamStatus,
      );
    }
    const check = (await verification.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !check.success ||
      check.hostname !== new URL(origin).hostname ||
      check.action !== "contact"
    ) {
      return deliveryFailure(
        422,
        "送信前の確認が有効ではありません。もう一度確認してください。",
        requestId, stage, 'verification_rejected', upstreamStatus,
      );
    }

    stage = 'resend_fetch';
    upstreamStatus = undefined;
    const mail = await upstream(
      fetcher,
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `contact/${data.requestId}`,
        },
        body: JSON.stringify({
          from: env.CONTACT_FROM_EMAIL,
          to: [env.CONTACT_TO_EMAIL],
          reply_to: data.email,
          subject: "【oneight】Webサイトからのご相談",
          text: `お名前：${typeof data.name === 'string' && data.name.trim() ? data.name.trim() : '未入力'}\n店舗名・教室名：${typeof data.shop === 'string' && data.shop.trim() ? data.shop.trim() : '未入力'}\nメール：${data.email}\n業種：${typeof data.industry === 'string' && data.industry ? industryLabels[data.industry] : '未入力'}\n\n相談内容：\n${(data.message as string).trim()}\n\n個人情報の取り扱いへの同意：あり`,
        }),
      },
      10_000,
    );
    stage = 'resend_response';
    upstreamStatus = mail.status;
    if (!mail.ok) {
      return deliveryFailure(
        503,
        "送信の受付を確認できませんでした。入力内容は残っています。時間をおいて再度お試しください。",
        requestId, stage, 'upstream_http_error', upstreamStatus,
      );
    }
    const receipt = (await mail.json()) as { id?: unknown };
    if (typeof receipt.id !== "string" || !receipt.id) {
      return deliveryFailure(
        503,
        "送信の受付を確認できませんでした。時間をおいて再度お試しください。",
        requestId, stage, 'invalid_receipt', upstreamStatus,
      );
    }
    return json(
      200,
      "ご相談の送信を受け付けました。内容を確認のうえ、入力いただいたメールアドレスへご連絡します。",
    );
  } catch (error) {
    return deliveryFailure(
      503,
      "接続に時間がかかっているため、送信の受付を確認できませんでした。入力内容を変えずに再度お試しください。",
      requestId, stage, error instanceof SyntaxError ? 'invalid_json' : 'upstream_exception', upstreamStatus,
    );
  }
}

export const onRequest = ({ request, env }: Context): Promise<Response> =>
  handleContact(request, env);
