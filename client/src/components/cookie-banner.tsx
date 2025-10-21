import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getConsent, saveConsent, defaultConsent, type ConsentMap } from "@/lib/cookies";

const POLICY_VERSION = "1.0.0"; // bump when policy changes

export default function CookieBanner() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [consent, setConsent] = useState<ConsentMap>(defaultConsent(POLICY_VERSION));

  useEffect(() => {
    const c = getConsent();
    if (!c || c.version !== POLICY_VERSION) {
      setOpen(true);
    }
  }, []);

  const acceptAll = () => {
    const c = { ...consent, preferences: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() };
    saveConsent(c); setConsent(c); setOpen(false);
  };

  const rejectAll = () => {
    const c = { ...consent, preferences: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
    saveConsent(c); setConsent(c); setOpen(false);
  };

  const saveCustom = () => {
    const c = { ...consent, updatedAt: new Date().toISOString() };
    saveConsent(c); setOpen(false); setPanel(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur border-t safe-area-b">
      <div className="mx-auto max-w-5xl p-4 flex flex-col gap-3">
        <div className="text-sm text-muted-foreground">
          {t('cookies.banner.message')}
        </div>
        {!panel ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={rejectAll} className="px-4 py-3 rounded-md border min-h-[44px]">
              {t('cookies.rejectAll')}
            </button>
            <button onClick={() => setPanel(true)} className="px-4 py-3 rounded-md border min-h-[44px]">
              {t('cookies.banner.customize')}
            </button>
            <button onClick={acceptAll} className="px-4 py-3 rounded-md bg-foreground text-background min-h-[44px]">
              {t('cookies.acceptAll')}
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked readOnly /> {t('cookies.banner.necessary')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={consent.preferences} onChange={e => setConsent(s => ({...s, preferences: e.target.checked}))}/>
              {t('cookies.types.functional.title')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={consent.analytics} onChange={e => setConsent(s => ({...s, analytics: e.target.checked}))}/>
              {t('cookies.types.analytics.title')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={consent.marketing} onChange={e => setConsent(s => ({...s, marketing: e.target.checked}))}/>
              {t('cookies.types.marketing.title')}
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setPanel(false)} className="px-4 py-3 rounded-md border min-h-[44px]">{t('common.back')}</button>
              <button onClick={saveCustom} className="px-4 py-3 rounded-md bg-foreground text-background min-h-[44px]">{t('cookies.savePreferences')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
