import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { FlagIcon, LANGUAGE_LABEL } from "./flag-icons";
import CookieBanner from "./cookie-banner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { getConsent, saveConsent } from "@/lib/cookies";
import VisaMark from "@/assets/payments/visa.svg?url";
import MastercardMark from "@/assets/payments/mastercard.svg?url";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/lib/authContext";

export default function Footer() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const codes: Array<typeof lang> = ['it','en','fr','de','es'];

  const goToModels = () => {
    window.location.href = "/models";
  };

  const showComingSoon = (feature: string) => {
    alert(`${feature} - Coming Soon! 🚀`);
  };

  return (
  <footer className="bg-secondary border-t border-border pt-12 pb-6 safe-area-b" data-testid="footer">
      <div className="container mx-auto px-4">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div data-testid="footer-about">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src={BRAND.LOGO_SVG}
                alt={BRAND.ALT}
                width={150}
                height={50}
                className="bg-transparent h-auto w-auto select-none pointer-events-none"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </div>
            <p className="text-muted text-sm mb-4">
              {t('footer.about.description')}
            </p>
          </div>
          
          {/* Quick Links + Help as accordion on mobile */}
          <div className="md:hidden col-span-1">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="quick-links">
                <AccordionTrigger className="text-foreground">{t('footer.quickLinks.title')}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/models" className="text-muted hover:text-gold-primary transition-colors text-left" data-testid="footer-link-browse">{t('footer.quickLinks.browse')}</a></li>
                    <li><a href="/become-model" className="text-muted hover:text-gold-primary transition-colors text-left" data-testid="footer-link-become-model">{t('footer.quickLinks.becomeModel')}</a></li>
                    {user?.role === 'model' && (
                      <li><a href="/dashboard/model" className="text-muted hover:text-gold-primary transition-colors text-left">Model Dashboard</a></li>
                    )}
                    {user?.role === 'admin' && (
                      <li><a href="/admin" className="text-muted hover:text-gold-primary transition-colors text-left">Admin</a></li>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="help-center">
                <AccordionTrigger className="text-foreground">{t('help.title')}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/help" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.help')}</a></li>
                    <li><a href="/contact" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.contact')}</a></li>
                    <li><a href="/faq" className="text-muted hover:text-gold-primary transition-colors">{t('faq.title')}</a></li>
                    <li><a href="/terms" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.terms')}</a></li>
                    <li><a href="/privacy" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.privacy')}</a></li>
                    <li><a href="/cookies" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.cookies')}</a></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Desktop columns */}
          <div className="hidden md:block" data-testid="footer-links">
            <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/models" className="text-muted hover:text-gold-primary transition-colors text-left" data-testid="footer-link-browse">{t('footer.quickLinks.browse')}</a></li>
              <li><a href="/become-model" className="text-muted hover:text-gold-primary transition-colors text-left" data-testid="footer-link-become-model">{t('footer.quickLinks.becomeModel')}</a></li>
              {user?.role === 'model' && (
                <li><a href="/dashboard/model" className="text-muted hover:text-gold-primary transition-colors text-left">Model Dashboard</a></li>
              )}
              {user?.role === 'admin' && (
                <li><a href="/admin" className="text-muted hover:text-gold-primary transition-colors text-left">Admin</a></li>
              )}
            </ul>
          </div>
          <div className="hidden md:block" data-testid="footer-support">
            <h3 className="font-semibold text-foreground mb-4">{t('help.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/help" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.help')}</a></li>
              <li><a href="/contact" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.contact')}</a></li>
              <li><a href="/faq" className="text-muted hover:text-gold-primary transition-colors">{t('faq.title')}</a></li>
              <li><a href="/terms" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.terms')}</a></li>
              <li><a href="/privacy" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.privacy')}</a></li>
              <li><a href="/cookies" className="text-muted hover:text-gold-primary transition-colors">{t('footer.support.cookies')}</a></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div data-testid="footer-payments">
            <h3 className="font-semibold text-foreground mb-4">{t('footer.payments.title')}</h3>
            <p className="text-muted text-sm mb-2">{t('footer.payments.description')}</p>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={VisaMark}
                alt="Visa"
                className="h-6 sm:h-7 w-auto select-none pointer-events-none"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <img
                src={MastercardMark}
                alt="Mastercard"
                className="h-6 sm:h-7 w-auto select-none pointer-events-none"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </div>
            {/* Caption removed per request */}
            
            <div className="p-3 bg-card rounded-lg">
              <div className="flex items-center space-x-2 text-xs text-muted">
                <i className="fas fa-shield-alt text-online"></i>
                <span>{t('footer.payments.secure')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted text-sm text-center md:text-left" data-testid="footer-copyright">
              © {currentYear} Kasyrooms. {t('footer.copyright')}
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/privacy" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-privacy-link">{t('footer.links.privacy')}</a>
              <a href="/terms" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-terms-link">{t('footer.links.terms')}</a>
              <a href="/cookies" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-cookies-link">{t('footer.links.cookies')}</a>
              <a href="/terms#policies" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-policies-link">{t('footer.links.policies')}</a>
              <a href="/18plus" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-18plus-link">18+</a>
              <button
                type="button"
                onClick={() => { const c = getConsent(); if (c) { c.version = "force-open"; saveConsent(c); } else { saveConsent({ necessary:true, preferences:false, analytics:false, marketing:false, updatedAt:new Date().toISOString(), version:"force-open" }); } window.dispatchEvent(new Event('storage')); }}
                className="text-muted hover:text-gold-primary transition-colors"
              >
                {t('cookies.preferences.title')}
              </button>
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(o=>!o)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-card border border-border hover:bg-accent text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                >
                  <FlagIcon code={lang} />
                  <span className="hidden sm:inline text-xs uppercase tracking-wide">{lang}</span>
                  <i className="fas fa-chevron-up text-xs transition-transform" style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)'}}></i>
                </button>
                {open && (
                  <ul
                    className="absolute bottom-full mb-2 right-0 bg-popover border border-border rounded-md shadow-lg w-32 overflow-hidden z-20"
                    role="listbox"
                  >
                    {codes.map(code => (
                      <li key={code}>
                        <button
                          type="button"
                          onClick={() => { setLang(code); setOpen(false); }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${lang===code ? 'bg-accent/60 font-medium' : ''}`}
                          role="option"
                          aria-selected={lang===code}
                        >
                          <FlagIcon code={code} />
                          <span className="tracking-wide text-xs">{LANGUAGE_LABEL[code]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CookieBanner />
    </footer>
  );
}
