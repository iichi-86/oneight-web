import test from 'node:test';
import assert from 'node:assert/strict';
import { contactBuildEnabled, contactRuntimeEnabled } from '../src/data/contact-release.ts';

const productionOrigin = 'https://oneight.jp';
const productionBranch = 'feat/oneight-official-site';

test('build release fallback enables only the configured production Pages build', () => {
  assert.equal(contactBuildEnabled(undefined, productionOrigin, '1', productionBranch), true);
  for (const [origin, pages, branch] of [
    [productionOrigin, undefined, productionBranch],
    [productionOrigin, '0', productionBranch],
    [productionOrigin, 'true', productionBranch],
    [productionOrigin, '1', undefined],
    [productionOrigin, '1', 'feature/preview'],
    [productionOrigin, '1', 'main'],
    ['https://preview.oneight-web.pages.dev', '1', productionBranch],
    ['https://www.oneight.jp', '1', productionBranch],
    ['http://localhost:4321', undefined, undefined],
  ] as const) {
    assert.equal(contactBuildEnabled(undefined, origin, pages, branch), false, JSON.stringify({ origin, pages, branch }));
  }
});

test('explicit build settings override the release while false, empty and unknown values stop it', () => {
  for (const setting of ['false', '', '0', 'False', 'TRUE', ' true', 'unknown']) {
    assert.equal(contactBuildEnabled(setting, productionOrigin, '1', productionBranch), false, JSON.stringify(setting));
  }
  assert.equal(contactBuildEnabled('true', 'http://localhost:4321', undefined, undefined), true);
  assert.equal(contactBuildEnabled('true', 'https://preview.oneight-web.pages.dev', '1', 'feature/preview'), true);
});

test('runtime release fallback requires both allowed and request origins to equal the production origin', () => {
  assert.equal(contactRuntimeEnabled(undefined, productionOrigin, productionOrigin), true);
  for (const [allowedOrigin, requestOrigin] of [
    [undefined, productionOrigin],
    ['', productionOrigin],
    ['https://attacker.test', productionOrigin],
    ['https://oneight.jp/', productionOrigin],
    [productionOrigin, 'https://preview.oneight-web.pages.dev'],
    ['https://preview.oneight-web.pages.dev', 'https://preview.oneight-web.pages.dev'],
    [productionOrigin, 'https://www.oneight.jp'],
    ['http://localhost:8788', 'http://localhost:8788'],
  ] as const) {
    assert.equal(contactRuntimeEnabled(undefined, allowedOrigin, requestOrigin), false, JSON.stringify({ allowedOrigin, requestOrigin }));
  }
});

test('explicit runtime settings remain the override and emergency stop', () => {
  for (const setting of ['false', '', '0', 'False', 'TRUE', ' true', 'unknown']) {
    assert.equal(contactRuntimeEnabled(setting, productionOrigin, productionOrigin), false, JSON.stringify(setting));
  }
  // Explicit enable preserves existing caller behavior; the API separately validates all bindings and the Origin header.
  assert.equal(contactRuntimeEnabled('true', 'https://oneight.test', 'https://oneight.test'), true);
});
