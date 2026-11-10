// Only public configuration belongs here. Do not pass form values to analytics.
import type { PostHog } from 'posthog-js';
import { cleanProps, sanitizePosthogEvent } from './analyticsSanitize';
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
export const CONSENT_KEY = 'hadahana.analytics-consent.v1';
type Props = Record<string, string | number | boolean>;
let client: PostHog | undefined;
let loading: Promise<void> | undefined;
let generation = 0;
let userId: string | undefined;
let currentPath = '/';
let lastPageview: string | undefined;
export function doNotTrack(): boolean {
  return typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes');
}
export function configured(): boolean { return Boolean(posthogKey || gaId); }
export function consentChoice(): string | null {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
function allowed(): boolean {
  return typeof window !== 'undefined' && configured() && !doNotTrack() && consentChoice() === 'accepted';
}
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
const win = () => window as AnalyticsWindow;
function locationUrl(): string { return window.location.origin + currentPath; }
export function setConsent(accept: boolean): void {
  const wasAllowed = Boolean(loading);
  try { localStorage.setItem(CONSENT_KEY, accept && !doNotTrack() ? 'accepted' : 'declined'); } catch { return; }
  if (!accept || doNotTrack()) {
    generation++;
    client?.opt_out_capturing();
    userId = undefined;
    if (wasAllowed) {
      // A reload unloads GA completely; no background collection after withdrawal.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (name.startsWith('hadahana_ga')) document.cookie = `${name}=; Max-Age=0; path=/hadahana; SameSite=Lax`;
      }
      window.location.reload();
    }
  }
}
async function initialize(): Promise<void> {
  if (!allowed()) return;
  if (loading) return loading;
  const version = generation;
  loading = (async () => {
    if (gaId) {
      try {
        win().dataLayer = win().dataLayer || [];
        // gtag expects an Arguments object, not an Array.
        // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
        win().gtag = function (..._args: unknown[]) { win().dataLayer!.push(arguments); };
        win().gtag!('js', new Date());
        win().gtag!('set', { page_location: locationUrl(), page_referrer: '', page_title: 'hadahana' });
        win().gtag!('config', gaId, {
          send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
          cookie_prefix: 'hadahana', cookie_path: '/hadahana', cookie_domain: 'none',
          page_location: locationUrl(), page_referrer: '', page_title: 'hadahana',
        });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        document.head.appendChild(script);
      } catch { /* Provider/script blocking must not affect PostHog or the app. */ }
    }
    if (posthogKey) {
      try {
        const { default: posthog } = await import('posthog-js');
        if (!allowed() || version !== generation) return;
        posthog.init(posthogKey, {
          api_host: posthogHost || 'https://us.i.posthog.com',
          persistence_name: 'hadahana', persistence: 'localStorage', cross_subdomain_cookie: false,
          capture_pageview: false, capture_pageleave: false, person_profiles: 'identified_only',
          autocapture: { css_selector_allowlist: ['[data-analytics-safe="true"]'], dom_event_allowlist: ['click'], capture_copied_text: false },
          mask_all_text: true, mask_all_element_attributes: true,
          disable_session_recording: true, disable_surveys: true,
          capture_performance: false, capture_heatmaps: false, capture_dead_clicks: false, rageclick: false,
          advanced_disable_flags: true, advanced_disable_feature_flags: true,
          disable_external_dependency_loading: true, respect_dnt: true,
          save_referrer: false, save_campaign_params: false,
          before_send: (event) => {
            if (!event || !allowed()) return null;
            // Keep the project API token and SDK envelope; still strip PII and URL query params.
            return sanitizePosthogEvent(event, { origin: window.location.origin, path: currentPath, app: 'hadahana' });
          },
        });
        client = posthog;
        client.opt_in_capturing({ captureEventName: false });
      } catch { /* An unavailable provider must never break the application. */ }
    }
  })();
  return loading;
}
export function track(event: string, props: Props = {}): void {
  if (!allowed() || !/^[a-z][a-z0-9_]{0,39}$/.test(event)) return;
  const safe = { ...cleanProps(props), app: 'hadahana', page_path: currentPath };
  const pageLocation = window.location.origin + currentPath;
  void initialize().then(() => {
    if (!allowed()) return;
    try {
      client?.capture(event === 'page_view' ? '$pageview' : event, safe);
    } catch { /* PostHog is optional. */ }
    try {
      if (gaId) win().gtag?.('event', event, { ...safe, send_to: gaId, page_location: pageLocation, page_referrer: '', page_title: 'hadahana' });
    } catch { /* GA is optional and independent. */ }
  }).catch(() => {});
}
export function pageview(path: string): void {
  currentPath = path;
  if (!allowed() || lastPageview === path) return;
  lastPageview = path;
  track('page_view', { page_path: path });
}
/** Internal opaque IDs only. Never email, names, auth tokens or profile values. */
export function identifyUser(id: unknown): void {
  if (!allowed() || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{6,80}$/.test(id)) return;
  if (userId === id) return;
  userId = id;
  void initialize().then(() => {
    if (!allowed() || userId !== id) return;
    client?.identify(id);
    win().gtag?.('set', { user_id: id });
  }).catch(() => {});
}
export function resetIdentity(): void {
  userId = undefined;
  if (!allowed()) return;
  client?.reset();
  win().gtag?.('set', { user_id: null });
}
