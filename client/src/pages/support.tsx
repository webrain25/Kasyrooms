import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function Support() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('support.title')}</h1>
        <p className="mb-6 text-muted">{t('support.intro')}</p>
        <ul className="space-y-2">
          <li><a href="/contact" className="text-primary hover:underline">{t('support.contact')}</a></li>
          <li><a href="/faq" className="text-primary hover:underline">{t('support.faq')}</a></li>
          <li><a href="/help-center" className="text-primary hover:underline">{t('support.help')}</a></li>
        </ul>
        <div className="mt-8">
          <strong>{t('support.email')}:</strong> <a href="mailto:info@kasyrooms.com" className="text-primary hover:underline">info@kasyrooms.com</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
