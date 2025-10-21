import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useI18n();
  const items = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q3', a: 'faq.a3' },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('faq.intro')}</p>
        <div className="space-y-6">
          {items.map((it, idx) => (
            <div key={idx} className="p-6 rounded-lg border border-border bg-card">
              <h2 className="font-semibold mb-2">{t(it.q)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(it.a)}</p>
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