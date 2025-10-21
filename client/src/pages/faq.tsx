import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function FAQ() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="mb-6 text-muted">{t('faq.intro')}</p>
        <ul className="space-y-4">
          <li>
            <strong>{t('faq.q1')}</strong>
            <div>{t('faq.a1')}</div>
          </li>
          <li>
            <strong>{t('faq.q2')}</strong>
            <div>{t('faq.a2')}</div>
          </li>
          <li>
            <strong>{t('faq.q3')}</strong>
            <div>{t('faq.a3')}</div>
          </li>
        </ul>
      </main>
      <Footer />
    </div>
  );
}
