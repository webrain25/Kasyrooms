export type ConsentMap = {
  necessary: boolean; // always true
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: string;
};

const KEY = "kasyrooms_cookie_consent";

export function getConsent(): ConsentMap | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function saveConsent(c: ConsentMap) {
  localStorage.setItem(KEY, JSON.stringify(c));
  // Optional: push to dataLayer for Consent Mode v2
  // ;(window as any).dataLayer = (window as any).dataLayer || [];
  // ;(window as any).dataLayer.push({
  //   event: 'consent_update',
  //   ad_storage: c.marketing ? 'granted' : 'denied',
  //   analytics_storage: c.analytics ? 'granted' : 'denied',
  //   functionality_storage: c.preferences ? 'granted' : 'denied',
  //   security_storage: 'granted'
  // });
}

export function defaultConsent(version = "1.0.0"): ConsentMap {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    version
  };
}
