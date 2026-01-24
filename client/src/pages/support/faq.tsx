import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useI18n();
  const questions = Array.from({ length: 10 }, (_, i) => `faq.q${i + 1}`);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('faq.intro')}</p>
        <div className="space-y-6">
          {questions.map((k) => (
            <div key={k} className="p-6 rounded-lg border border-border bg-card">
              <h2 className="font-semibold">{t(k)}</h2>
            </div>
          ))}
        </div>
        <div className="mt-12 text-sm text-muted-foreground">
          {t('faq.stillNeed')} <a href="/contact" className="text-primary hover:underline">{t('contact.title')}</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}