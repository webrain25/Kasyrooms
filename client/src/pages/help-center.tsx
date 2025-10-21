import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function HelpCenter() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('help.title')}</h1>
        <p className="mb-6 text-muted">{t('help.intro')}</p>
        <ul className="space-y-2">
          <li><a href="/support" className="text-primary hover:underline">{t('help.support')}</a></li>
          <li><a href="/contact" className="text-primary hover:underline">{t('help.contact')}</a></li>
          <li><a href="/faq" className="text-primary hover:underline">{t('help.faq')}</a></li>
          <li><a href="/terms" className="text-primary hover:underline">{t('help.terms')}</a></li>
          <li><a href="/privacy" className="text-primary hover:underline">{t('help.privacy')}</a></li>
        </ul>
      </main>
      <Footer />
    </div>
  );
}
