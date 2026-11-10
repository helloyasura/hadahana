import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanitizePosthogEvent, type PosthogCaptureEvent } from '../src/lib/analyticsSanitize.ts';

const ctx = { origin: 'https://ervanta.com', path: '/hadahana', app: 'hadahana' };
const SAMPLE_TOKEN = 'phc_test_project_token_not_real';

function sampleEvent(overrides: Partial<PosthogCaptureEvent> = {}): PosthogCaptureEvent {
  return {
    uuid: 'evt-uuid-1',
    event: '$pageview',
    timestamp: '2026-11-10T06:00:00.000Z',
    properties: {
      token: SAMPLE_TOKEN,
      distinct_id: 'anon-123',
      $device_id: 'dev-123',
      $session_id: 'ses-123',
      $window_id: 'win-123',
      $lib: 'web',
      $lib_version: '1.258.0',
      $insert_id: 'ins123abcd',
      $time: 1762754400,
      $sent_at: 1762754401,
      $is_identified: false,
      $anon_distinct_id: 'anon-123',
      $process_person_profile: false,
      $event_type: 'pageview',
      $config_defaults: 'unset',
      $groups: { company: 'acme' },
      tool: 'nakath',
      page_path: '/hadahana',
      email: 'person@example.com',
      name: 'Ada Lovelace',
      $current_url: 'https://ervanta.com/hadahana?utm=secret&order=99',
      $referrer: 'https://google.com/search?q=private',
      $raw_user_agent: 'Mozilla/5.0 secret-device',
      password: 'not-a-real-password',
    },
    $set: {
      email: 'person@example.com',
      plan: 'starter',
    },
    $set_once: {
      $initial_current_url: 'https://ervanta.com/hadahana?ref=email@x.com&q=1',
      $initial_referrer: 'https://google.com/search?q=private',
      $initial_pathname: '/hadahana',
    },
    ...overrides,
  };
}

test('preserves the project API token and other SDK envelope fields', () => {
  const result = sanitizePosthogEvent(sampleEvent(), ctx);
  assert.ok(result);
  assert.equal(result.properties?.token, SAMPLE_TOKEN);
  assert.equal(result.properties?.distinct_id, 'anon-123');
  assert.equal(result.properties?.$device_id, 'dev-123');
  assert.equal(result.properties?.$session_id, 'ses-123');
  assert.equal(result.properties?.$window_id, 'win-123');
  assert.equal(result.properties?.$lib, 'web');
  assert.equal(result.properties?.$lib_version, '1.258.0');
  assert.equal(result.properties?.$insert_id, 'ins123abcd');
  assert.equal(result.properties?.$time, 1762754400);
  assert.equal(result.properties?.$sent_at, 1762754401);
  assert.equal(result.properties?.$is_identified, false);
  assert.equal(result.properties?.$anon_distinct_id, 'anon-123');
  assert.equal(result.properties?.$process_person_profile, false);
  assert.equal(result.properties?.$event_type, 'pageview');
  assert.equal(result.properties?.$config_defaults, 'unset');
  assert.deepEqual(result.properties?.$groups, { company: 'acme' });
  assert.equal(result.uuid, 'evt-uuid-1');
  assert.equal(result.timestamp, '2026-11-10T06:00:00.000Z');
  assert.equal(result.event, '$pageview');
});

test('keeps allowlisted product props and the app name', () => {
  const result = sanitizePosthogEvent(sampleEvent(), ctx);
  assert.ok(result);
  assert.equal(result.properties?.app, 'hadahana');
  assert.equal(result.properties?.tool, 'nakath');
  assert.equal(result.properties?.page_path, '/hadahana');
});

test('strips PII, raw user agent, and URL query parameters', () => {
  const result = sanitizePosthogEvent(sampleEvent(), ctx);
  assert.ok(result);
  assert.equal(result.properties?.email, undefined);
  assert.equal(result.properties?.name, undefined);
  assert.equal(result.properties?.password, undefined);
  assert.equal(result.properties?.$raw_user_agent, undefined);
  assert.equal(result.properties?.$current_url, 'https://ervanta.com/hadahana');
  assert.equal(result.properties?.$pathname, '/hadahana');
  assert.equal(result.properties?.$referrer, '');
  assert.equal(result.properties?.$ip, '0.0.0.0');
  assert.equal(result.properties?.$geoip_disable, true);
  assert.ok(!JSON.stringify(result).includes('utm=secret'));
  assert.ok(!JSON.stringify(result).includes('person@example.com'));
});

test('keeps sanitized $set and $set_once for identify, without query params or emails', () => {
  const result = sanitizePosthogEvent(sampleEvent(), ctx);
  assert.ok(result);
  assert.deepEqual(result.$set, { plan: 'starter' });
  assert.equal(result.$set_once?.$initial_current_url, 'https://ervanta.com/hadahana');
  assert.equal(result.$set_once?.$initial_referrer, '');
  assert.equal(result.$set_once?.$initial_pathname, '/hadahana');
  assert.ok(!JSON.stringify(result.$set_once).includes('q=1'));
  assert.ok(!JSON.stringify(result).includes('email@x.com'));
});

test('returns null for a missing event', () => {
  assert.equal(sanitizePosthogEvent(null, ctx), null);
  assert.equal(sanitizePosthogEvent(undefined, ctx), null);
});
