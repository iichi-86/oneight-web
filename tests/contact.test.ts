import test, { after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, type ContactEnv } from '../functions/api/contact.ts';

const diagnosticLogs = mock.method(console, 'error', () => {});
after(() => mock.restoreAll());

const now = 1_800_000_000_000;
const env = { CONTACT_ENABLED: 'true', CONTACT_ALLOWED_ORIGIN: 'https://oneight.test', RESEND_API_KEY: 'unit-test-secret', CONTACT_TO_EMAIL: 'owner@oneight.test', CONTACT_FROM_EMAIL: 'contact@oneight.test', TURNSTILE_SECRET_KEY: 'unit-test-challenge' };
const input = { name: '相談 太郎', shop: '相談ベーカリー', email: 'owner@example.com', industry: 'bakery', message: '紙のスタンプカードをお店専用の会員アプリにしたいと考えています。', consent: true, website: '', startedAt: now - 10_000, requestId: 'a1b2c3d4-1234-4567-8901-abcdefabcdef', token: 'verified-token' };
function request(data: unknown = input, headers: Record<string, string> = {}): Request {
  return new Request('https://oneight.test/api/contact', { method: 'POST', headers: { origin: 'https://oneight.test', 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
const forbiddenFetch = async () => { throw new Error('Unexpected upstream call'); };
const provider = (calls: { url: string; init?: RequestInit }[], mode = 'success') => async (url: RequestInfo | URL, init?: RequestInit) => {
  calls.push({ url: String(url), init });
  if (String(url).includes('siteverify')) return Response.json({ success: mode !== 'challenge', hostname: mode === 'hostname' ? 'attacker.test' : 'oneight.test', action: mode === 'action' ? 'other' : 'contact' });
  if (mode === 'provider-error') return Response.json({ message: 'Provider internal error' }, { status: 500 });
  return Response.json(mode === 'empty-receipt' ? {} : { id: 'mail-receipt' });
};

test('unconfigured form returns 503 without upstream calls', async () => {
  const response = await handleContact(request(), { CONTACT_ALLOWED_ORIGIN: env.CONTACT_ALLOWED_ORIGIN }, forbiddenFetch, now);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal((await handleContact(request(), {}, forbiddenFetch, now)).status, 503);
});
test('rejects cross-origin, missing origin and mismatched runtime origin before upstream access', async () => {
  for (const origin of ['https://attacker.test', 'null', '']) assert.equal((await handleContact(request(input, { origin }), env, forbiddenFetch, now)).status, 403);
  assert.equal((await handleContact(request(), { ...env, CONTACT_ALLOWED_ORIGIN: 'https://other.test' }, forbiddenFetch, now)).status, 403);
});
test('validates required fields and rejects invalid optional fields and header injection', async () => {
  const response = await handleContact(request({ ...input, name: 'A\r\nB', shop: null, email: 'x\r\nb@example.com', industry: 'invalid', message: ' \n ', consent: false }), env, forbiddenFetch, now);
  assert.equal(response.status, 422);
  assert.deepEqual(Object.keys((await response.json()).errors).sort(), ['consent', 'email', 'industry', 'message', 'name', 'shop']);
});

const minimalInput = { email: input.email, message: '相談したい', consent: true, website: input.website, startedAt: input.startedAt, requestId: input.requestId, token: input.token };

test('a short inquiry with only email, message and consent user fields reaches provider acceptance', async () => {
  for (const optionalFields of [{}, { name: '', shop: '', industry: '' }, { name: '   ', shop: '　', industry: '' }]) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const response = await handleContact(request({ ...minimalInput, ...optionalFields }), env, provider(calls), now);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(calls.length, 2);
    const mail = JSON.parse(calls[1].init?.body as string);
    assert.equal(mail.reply_to, input.email);
    assert.match(mail.text, /お名前：未入力\n店舗名・教室名：未入力\n/);
    assert.match(mail.text, /業種：未入力\n/);
    assert.match(mail.text, /相談内容：\n相談したい\n/);
    assert.doesNotMatch(mail.text, /undefined|null/);
  }
});

test('email, nonblank message and consent remain required before any upstream call', async () => {
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const fields of [
    { email: undefined }, { email: '' }, { email: 'invalid' },
    { message: undefined }, { message: '' }, { message: ' \t\n　' }, { message: 'a'.repeat(4001) },
    { consent: undefined }, { consent: false },
  ]) {
    const response = await handleContact(request({ ...minimalInput, ...fields }), env, fetcher, now);
    assert.equal(response.status, 422, JSON.stringify(fields));
  }
  assert.equal(upstreamCalls, 0);
});

test('message length boundaries accept one character and 4000 Japanese characters', async () => {
  for (const message of ['あ', 'あ'.repeat(4000)]) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const response = await handleContact(request({ ...minimalInput, message }), env, provider(calls), now);
    assert.equal(response.status, 200, `message length ${message.length}`);
    assert.equal(calls.length, 2);
    assert.ok(JSON.parse(calls[1].init?.body as string).text.includes(`相談内容：\n${message}\n`));
  }
});

test('optional fields still reject wrong types, excess length, controls and unknown industries', async () => {
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const field of ['name', 'shop', 'industry']) {
    for (const value of [null, [], {}, 123, true]) {
      const response = await handleContact(request({ ...minimalInput, [field]: value }), env, fetcher, now);
      assert.equal(response.status, 422, `${field}=${JSON.stringify(value)}`);
      assert.deepEqual(Object.keys((await response.json()).errors), [field]);
    }
  }
  for (const [field, value] of [
    ['name', 'a'.repeat(101)], ['shop', 'a'.repeat(151)],
    ['name', '\n'], ['shop', '店舗\r\n名'], ['name', 'お名前\u0000'], ['shop', '店舗\u007f'],
    ['industry', 'unknown'], ['industry', '__proto__'],
  ]) {
    const response = await handleContact(request({ ...minimalInput, [field]: value }), env, fetcher, now);
    assert.equal(response.status, 422, `${field}=${JSON.stringify(value)}`);
    assert.deepEqual(Object.keys((await response.json()).errors), [field]);
  }
  assert.equal(upstreamCalls, 0);
});

test('complete legacy inquiries still preserve optional details and all former industry labels', async () => {
  for (const [industry, label] of [
    ['bakery', 'ベーカリー'], ['cafe', 'カフェ・コーヒースタンド'], ['sweets', '和菓子・洋菓子'],
    ['beauty', '美容・ネイル等のサロン'], ['pet', 'トリミングサロン'], ['other', 'その他'],
  ]) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const response = await handleContact(request({ ...input, industry }), env, provider(calls), now);
    assert.equal(response.status, 200, industry);
    const mail = JSON.parse(calls[1].init?.body as string);
    assert.match(mail.text, /お名前：相談 太郎\n店舗名・教室名：相談ベーカリー\n/);
    assert.ok(mail.text.includes(`\n業種：${label}\n`), industry);
  }
});
test('rejects trailing newlines in submitted and runtime email addresses', async () => {
  const response = await handleContact(request({ ...input, email: 'owner@example.com\n' }), env, forbiddenFetch, now);
  assert.equal(response.status, 422);
  assert.ok((await response.json()).errors.email);
  for (const field of ['CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL'] as const) {
    assert.equal((await handleContact(request(), { ...env, [field]: `${env[field]}\n` }, forbiddenFetch, now)).status, 503);
  }
});
test('rejects honeypot, fast submissions, future timestamps and invalid request IDs', async () => {
  for (const data of [{ website: 'https://spam.test' }, { startedAt: now }, { startedAt: now + 1000 }, { requestId: 'bad-id' }]) {
    assert.equal((await handleContact(request({ ...input, ...data }), env, forbiddenFetch, now)).status, 400);
  }
});
test('an older form can still submit with a freshly verified challenge', async () => {
  assert.equal((await handleContact(request({ ...input, startedAt: now - 8_000_000 }), env, provider([]), now)).status, 200);
});
test('enforces actual streamed byte length, malformed JSON and content type', async () => {
  assert.equal((await handleContact(request({ ...input, message: 'a'.repeat(17_000) }), env, forbiddenFetch, now)).status, 413);
  assert.equal((await handleContact(request(input, { 'content-type': 'text/plain' }), env, forbiddenFetch, now)).status, 415);
  const invalid = new Request('https://oneight.test/api/contact', { method: 'POST', headers: { origin: env.CONTACT_ALLOWED_ORIGIN, 'content-type': 'application/json' }, body: '{' });
  assert.equal((await handleContact(invalid, env, forbiddenFetch, now)).status, 400);
});
test('requires successful Turnstile with matching hostname and action', async () => {
  for (const mode of ['challenge', 'hostname', 'action']) {
    const calls: { url: string; init?: RequestInit }[] = [];
    assert.equal((await handleContact(request(), env, provider(calls, mode), now)).status, 422);
    assert.equal(calls.length, 1);
  }
});
test('only returns success after provider acceptance and preserves idempotency key', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const response = await handleContact(request(), env, provider(calls), now);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(calls.length, 2);
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers['Idempotency-Key'], `contact/${input.requestId}`);
  const mail = JSON.parse(calls[1].init?.body as string);
  assert.deepEqual(mail.to, [env.CONTACT_TO_EMAIL]);
  assert.equal(mail.reply_to, input.email);
  assert.match(mail.text, /相談ベーカリー/);
});
test('new customer industries are accepted and delivered with their Japanese labels', async () => {
  const expectedIndustries = [
    ['restaurant', '飲食店'],
    ['hair_salon', '美容院'],
    ['retail', '小売店'],
    ['nail_salon', 'ネイルサロン'],
    ['yoga', 'ヨガ教室'],
  ];
  for (const [industry, label] of expectedIndustries) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const response = await handleContact(request({ ...input, industry }), env, provider(calls), now);
    assert.equal(response.status, 200, industry);
    assert.equal(calls.length, 2, industry);
    const mail = JSON.parse(calls[1].init?.body as string);
    assert.ok(mail.text.includes(`\n業種：${label}\n`), `${industry} must be labeled ${label} in the inquiry`);
  }
});
test('upstream failures and timeouts never become success or leak provider details', async () => {
  for (const mode of ['provider-error', 'empty-receipt']) assert.equal((await handleContact(request(), env, provider([], mode), now)).status, 503);
  const response = await handleContact(request(), env, async () => { throw new Error('provider secret'); }, now);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /provider secret|unit-test/);
});
test('non-POST requests are rejected', async () => {
  const response = await handleContact(new Request('https://oneight.test/api/contact'), env, forbiddenFetch, now);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

const releaseEnv: ContactEnv = {
  ...env,
  CONTACT_ENABLED: undefined,
  CONTACT_ALLOWED_ORIGIN: 'https://oneight.jp',
  CONTACT_FROM_EMAIL: 'contact@oneight.jp',
};
function releaseRequest(origin = 'https://oneight.jp', headerOrigin = origin, data: unknown = input): Request {
  return new Request(`${origin}/api/contact`, {
    method: 'POST',
    headers: { origin: headerOrigin, 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
}

test('approved production release sends through mocked providers without the runtime flag', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const response = await handleContact(releaseRequest(), releaseEnv, async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url) === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      return Response.json({ success: true, hostname: 'oneight.jp', action: 'contact' });
    }
    assert.equal(String(url), 'https://api.resend.com/emails');
    return Response.json({ id: 'mocked-production-receipt' });
  }, now);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].init?.body as string).from, 'contact@oneight.jp');
});

test('production release still requires every runtime binding before any provider call', async () => {
  const required: (keyof ContactEnv)[] = ['CONTACT_ALLOWED_ORIGIN', 'RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL'];
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const key of required) {
    for (const value of [undefined, '']) {
      const response = await handleContact(releaseRequest(), { ...releaseEnv, [key]: value }, fetcher, now);
      assert.equal(response.status, 503, `${key}=${JSON.stringify(value)}`);
    }
  }
  assert.equal(upstreamCalls, 0);
});

test('preview and local requests cannot activate the production fallback even with complete bindings', async () => {
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const origin of ['https://preview.oneight-web.pages.dev', 'https://www.oneight.jp', 'http://localhost:8788']) {
    assert.equal((await handleContact(releaseRequest(origin), releaseEnv, fetcher, now)).status, 503, origin);
    assert.equal((await handleContact(releaseRequest(origin), { ...releaseEnv, CONTACT_ALLOWED_ORIGIN: origin }, fetcher, now)).status, 503, `${origin} with matching preview binding`);
  }
  assert.equal(upstreamCalls, 0);
});

test('runtime false, empty and unknown flags stop approved production without any provider call', async () => {
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const CONTACT_ENABLED of ['false', '', '0', 'FALSE', 'unknown']) {
    assert.equal((await handleContact(releaseRequest(), { ...releaseEnv, CONTACT_ENABLED }, fetcher, now)).status, 503, JSON.stringify(CONTACT_ENABLED));
  }
  assert.equal(upstreamCalls, 0);
});

test('production release fallback keeps Origin-header checks and field validation before upstream access', async () => {
  let upstreamCalls = 0;
  const fetcher: typeof fetch = async () => { upstreamCalls++; return Response.json({ id: 'must-not-be-used' }); };
  for (const header of ['', 'null', 'https://attacker.test']) {
    assert.equal((await handleContact(releaseRequest('https://oneight.jp', header), releaseEnv, fetcher, now)).status, 403);
  }
  const response = await handleContact(releaseRequest('https://oneight.jp', 'https://oneight.jp', {}), releaseEnv, fetcher, now);
  assert.equal(response.status, 422);
  assert.equal(upstreamCalls, 0);
});

test('delivery diagnostics distinguish failure stages without logging private values', async () => {
  const privateInput = { ...input, name: 'private-name-canary', shop: 'private-shop-canary', email: 'private-reply-canary@fixture.invalid', message: 'private-message-canary', token: 'private-token-canary' };
  const privateEnv = { ...env, RESEND_API_KEY: 'private-resend-key-canary', TURNSTILE_SECRET_KEY: 'private-turnstile-key-canary', CONTACT_FROM_EMAIL: 'private-from-canary@fixture.invalid', CONTACT_TO_EMAIL: 'private-to-canary@fixture.invalid' };
  const privateIp = '192.0.2.42';
  const privateBody = 'private-provider-body-canary';
  const privateException = 'private-exception-canary';
  const messages = {
    turnstileHttp: '確認サービスに接続できませんでした。少し時間をおいて再度お試しください。',
    rejected: '送信前の確認が有効ではありません。もう一度確認してください。',
    resendHttp: '送信の受付を確認できませんでした。入力内容は残っています。時間をおいて再度お試しください。',
    receipt: '送信の受付を確認できませんでした。時間をおいて再度お試しください。',
    exception: '接続に時間がかかっているため、送信の受付を確認できませんでした。入力内容を変えずに再度お試しください。',
  };
  const cases = [
    { mode: 'turnstile-http', stage: 'turnstile_response', code: 'upstream_http_error', httpStatus: 403, status: 503, message: messages.turnstileHttp },
    { mode: 'turnstile-invalid-secret', stage: 'turnstile_response', code: 'verification_configuration_error', httpStatus: 400, status: 503, message: messages.turnstileHttp },
    { mode: 'turnstile-missing-secret', stage: 'turnstile_response', code: 'verification_configuration_error', httpStatus: 400, status: 503, message: messages.turnstileHttp },
    { mode: 'turnstile-other-400', stage: 'turnstile_response', code: 'upstream_http_error', httpStatus: 400, status: 503, message: messages.turnstileHttp },
    { mode: 'turnstile-non-json-400', stage: 'turnstile_response', code: 'upstream_http_error', httpStatus: 400, status: 503, message: messages.turnstileHttp },
    { mode: 'turnstile-rejected', stage: 'turnstile_response', code: 'verification_rejected', httpStatus: 200, status: 422, message: messages.rejected },
    { mode: 'turnstile-json', stage: 'turnstile_response', code: 'invalid_json', httpStatus: 200, status: 503, message: messages.exception },
    { mode: 'turnstile-exception', stage: 'turnstile_fetch', code: 'upstream_exception', status: 503, message: messages.exception },
    { mode: 'resend-http', stage: 'resend_response', code: 'upstream_http_error', httpStatus: 429, status: 503, message: messages.resendHttp },
    { mode: 'resend-json', stage: 'resend_response', code: 'invalid_json', httpStatus: 200, status: 503, message: messages.exception },
    { mode: 'resend-receipt', stage: 'resend_response', code: 'invalid_receipt', httpStatus: 200, status: 503, message: messages.receipt },
    { mode: 'resend-null', stage: 'resend_response', code: 'upstream_exception', httpStatus: 200, status: 503, message: messages.exception },
    { mode: 'resend-exception', stage: 'resend_fetch', code: 'upstream_exception', status: 503, message: messages.exception },
    { mode: 'resend-status-zero', stage: 'resend_response', code: 'upstream_http_error', status: 503, message: messages.resendHttp },
  ];
  const privateValues = [privateInput.name, privateInput.shop, privateInput.email, privateInput.message, privateInput.token, privateEnv.RESEND_API_KEY, privateEnv.TURNSTILE_SECRET_KEY, privateEnv.CONTACT_FROM_EMAIL, privateEnv.CONTACT_TO_EMAIL, privateIp, privateBody, privateException];
  for (const scenario of cases) {
    const start = diagnosticLogs.mock.calls.length;
    const response = await handleContact(request(privateInput, { 'cf-connecting-ip': privateIp }), privateEnv, async url => {
      if (String(url).includes('siteverify')) {
        if (scenario.mode === 'turnstile-http') return new Response(privateBody, { status: 403 });
        if (scenario.mode === 'turnstile-invalid-secret') return Response.json({ 'error-codes': ['invalid-input-secret'], debug: privateBody }, { status: 400 });
        if (scenario.mode === 'turnstile-missing-secret') return Response.json({ 'error-codes': ['missing-input-secret'], debug: privateBody }, { status: 400 });
        if (scenario.mode === 'turnstile-other-400') return Response.json({ 'error-codes': [privateBody] }, { status: 400 });
        if (scenario.mode === 'turnstile-non-json-400') return new Response(privateBody, { status: 400 });
        if (scenario.mode === 'turnstile-rejected') return Response.json({ success: false, debug: privateBody });
        if (scenario.mode === 'turnstile-json') return new Response(privateBody, { status: 200 });
        if (scenario.mode === 'turnstile-exception') throw new Error(privateException);
        return Response.json({ success: true, hostname: 'oneight.test', action: 'contact' });
      }
      if (scenario.mode === 'resend-http') return new Response(privateBody, { status: 429 });
      if (scenario.mode === 'resend-json') return new Response(privateBody, { status: 200 });
      if (scenario.mode === 'resend-receipt') return Response.json({ debug: privateBody });
      if (scenario.mode === 'resend-null') return Response.json(null);
      if (scenario.mode === 'resend-exception') throw new Error(privateException);
      if (scenario.mode === 'resend-status-zero') return Response.error();
      throw new Error('Unexpected test scenario');
    }, now);
    assert.equal(response.status, scenario.status, scenario.mode);
    const result = await response.json();
    assert.equal(result.message, scenario.message, scenario.mode);
    assert.equal(result.ok, false, scenario.mode);
    assert.match(response.headers.get('content-type') || '', /^application\/json/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const emitted = diagnosticLogs.mock.calls.slice(start);
    assert.equal(emitted.length, 1, scenario.mode);
    assert.equal(emitted[0].arguments.length, 1, scenario.mode);
    const encoded = emitted[0].arguments[0];
    assert.equal(typeof encoded, 'string');
    assert.deepEqual(JSON.parse(encoded), {
      event: 'contact_delivery_failure', requestId: input.requestId, stage: scenario.stage, code: scenario.code,
      ...('httpStatus' in scenario ? { httpStatus: scenario.httpStatus } : {}),
    }, scenario.mode);
    const { event: _event, ...expectedDiagnostic } = JSON.parse(encoded);
    assert.deepEqual(result.diagnostic, expectedDiagnostic, scenario.mode);
    for (const value of privateValues) {
      assert.ok(!encoded.includes(value), `${scenario.mode} must not log private fields`);
      assert.ok(!JSON.stringify(result).includes(value), `${scenario.mode} must not expose private fields`);
    }
  }
});

test('successful delivery and failures before external checks do not produce delivery diagnostics', async () => {
  const start = diagnosticLogs.mock.calls.length;
  assert.equal((await handleContact(request(), env, provider([]), now)).status, 200);
  assert.equal((await handleContact(request(), {}, forbiddenFetch, now)).status, 503);
  assert.equal((await handleContact(request({}, {}), env, forbiddenFetch, now)).status, 422);
  assert.equal((await handleContact(request({ ...input, requestId: 'private-invalid-uuid-canary' }), env, forbiddenFetch, now)).status, 400);
  assert.equal((await handleContact(request({ ...input, token: '' }), env, forbiddenFetch, now)).status, 422);
  assert.equal(diagnosticLogs.mock.calls.length, start);
});
