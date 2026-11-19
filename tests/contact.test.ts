import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../functions/api/contact.ts';

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
test('validates every required field and rejects header injection', async () => {
  const response = await handleContact(request({ ...input, name: 'A\r\nB', shop: '', email: 'x\r\nb@example.com', industry: 'invalid', message: '短い', consent: false }), env, forbiddenFetch, now);
  assert.equal(response.status, 422);
  assert.deepEqual(Object.keys((await response.json()).errors).sort(), ['consent', 'email', 'industry', 'message', 'name', 'shop']);
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
test('upstream failures and timeouts never become success or leak provider details', async () => {
  for (const mode of ['provider-error', 'empty-receipt']) assert.equal((await handleContact(request(), env, provider([], mode), now)).status, 502);
  const response = await handleContact(request(), env, async () => { throw new Error('provider secret'); }, now);
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /provider secret|unit-test/);
});
test('non-POST requests are rejected', async () => {
  const response = await handleContact(new Request('https://oneight.test/api/contact'), env, forbiddenFetch, now);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});
