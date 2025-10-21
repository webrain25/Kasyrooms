import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function GuidelinesPage() {
  const { t } = useI18n();
  const sections = [
    ['guidelines.section.safety.title','guidelines.section.safety.content'],
    ['guidelines.section.prohibited.title','guidelines.section.prohibited.content'],
    ['guidelines.section.privacy.title','guidelines.section.privacy.content'],
    ['guidelines.section.payments.title','guidelines.section.payments.content'],
    ['guidelines.section.reporting.title','guidelines.section.reporting.content'],
    ['guidelines.section.updates.title','guidelines.section.updates.content'],
  ];
  return (
  <div className="min-h-dvh flex flex-col bg-background">
      <Header />
    <main className="container mx-auto flex-1 px-4 py-8 md:py-10 prose prose-invert prose-headings:text-foreground prose-p:text-foreground/90 max-w-3xl">
  <h1 className="not-prose text-3xl md:text-4xl font-bold anchor-offset">{t('guidelines.title')}</h1>
        <p className="text-muted-foreground -mt-4 mb-6">{t('guidelines.subtitle')}</p>
        <p>{t('guidelines.intro')}</p>
        {sections.map(([title, content]) => (
          <section key={title}>
            <h2>{t(title)}</h2>
            <p>{t(content)}</p>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
