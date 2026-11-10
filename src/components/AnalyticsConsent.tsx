"use client";
import { useEffect, useState, type CSSProperties } from 'react';
import { CONSENT_KEY, configured, consentChoice, doNotTrack, setConsent, pageview } from '@/lib/analytics';
import { usePathname } from 'next/navigation';
const panel: CSSProperties = { position: 'fixed', bottom: 12, left: 12, right: 12, margin: 'auto', maxWidth: 660, zIndex: 10000, padding: 16, borderRadius: 14, background: '#101b30', color: '#fff', border: '1px solid #67e8f9', boxShadow: '0 8px 40px #0008', font: '14px/1.5 system-ui' };
const button: CSSProperties = { background: '#172c45', color: '#fff', border: '1px solid #94a3b8', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', margin: '8px 8px 0 0' };
export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const safePath = pathname === "/" || pathname === "/hadahana" ? "/hadahana" : "/hadahana/other";
  useEffect(() => {
    setEnabled(configured() && !doNotTrack());
    setVisible(configured() && !doNotTrack() && !consentChoice());
  }, []);
  useEffect(() => {
    pageview(safePath);
  }, [safePath]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === CONSENT_KEY && event.newValue !== 'accepted') {
        setConsent(false);
        setVisible(true);
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  function choose(accept: boolean) {
    setConsent(accept);
    setVisible(false);
    if (accept) pageview(safePath);
  }
  if (!enabled) return null;
  return visible ? (
    <aside role="region" aria-label="Analytics consent" style={panel} className="no-print">
      <strong>Help improve Hadahana?</strong>
      <p>With your permission, PostHog and Google Analytics measure page visits and feature clicks using analytics cookies/storage. We do not send form values, names, email addresses or birth details. You can decline and still use every feature.</p>
      <button style={button} onClick={() => choose(true)}>Accept analytics</button>
      <button style={button} onClick={() => choose(false)}>Decline analytics</button>
    </aside>
  ) : (
    <button className="no-print" style={{ ...button, position: 'fixed', bottom: 8, right: 8, zIndex: 9999, fontSize: 11, opacity: 0.9 }} onClick={() => setVisible(true)}>Analytics preferences</button>
  );
}
