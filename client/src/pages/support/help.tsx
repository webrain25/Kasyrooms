import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('help.title')}</h1>
        <p className="text-muted-foreground mb-6">{t('help.subtitle')}</p>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>{t('support.faq')} – <a href="/faq" className="text-primary hover:underline">{t('faq.title')}</a></li>
          <li>{t('support.contact')} – <a href="/contact" className="text-primary hover:underline">{t('contact.title')}</a></li>
          <li>{t('terms.title')} – <a href="/terms" className="text-primary hover:underline">{t('terms.title')}</a></li>
          <li>{t('privacy.title')} – <a href="/privacy" className="text-primary hover:underline">{t('privacy.title')}</a></li>
        </ul>
      </div>
      <Footer />
    </div>
  );
}
