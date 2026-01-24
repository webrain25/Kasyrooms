import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function FAQ() {
  const { t } = useI18n();
  const questions = Array.from({ length: 10 }, (_, i) => `faq.q${i + 1}`);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="mb-6 text-muted">{t('faq.intro')}</p>
        <ul className="space-y-4">
          {questions.map((k) => (
            <li key={k}>
              <strong>{t(k)}</strong>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
