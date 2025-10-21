import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function SupportLanding() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="text-4xl font-bold mb-4">{t('help.title')}</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">{t('help.subtitle')}</p>
        <div className="grid gap-6 md:grid-cols-3">
          <a href="/help" className="p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors">
            <h2 className="font-semibold mb-2">{t('help.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('help.subtitle')}</p>
          </a>
          <a href="/faq" className="p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors">
            <h2 className="font-semibold mb-2">{t('faq.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('faq.intro')}</p>
          </a>
          <a href="/contact" className="p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors">
            <h2 className="font-semibold mb-2">{t('contact.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('contact.subtitle')}</p>
          </a>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <a href="/terms" className="p-5 rounded-lg bg-muted/30 hover:bg-muted transition-colors text-sm font-medium">{t('terms.title')}</a>
          <a href="/privacy" className="p-5 rounded-lg bg-muted/30 hover:bg-muted transition-colors text-sm font-medium">{t('privacy.title')}</a>
          <a href="/cookies" className="p-5 rounded-lg bg-muted/30 hover:bg-muted transition-colors text-sm font-medium">{t('cookies.title')}</a>
        </div>
        {/* Policy links are centralized under Terms page to avoid duplication */}
        {/* Removed extra need-more-help block per request */}
      </main>
      <Footer />
    </div>
  );
}