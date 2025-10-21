import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function RefundPolicyPage() {
  const { t } = useI18n();
  const sections: [string,string][] = [
    ['refund.section.finality.title','refund.section.finality.content'],
    ['refund.section.unauthorized.title','refund.section.unauthorized.content'],
    ['refund.section.technical.title','refund.section.technical.content'],
    ['refund.section.chargebacks.title','refund.section.chargebacks.content'],
    ['refund.section.subscriptions.title','refund.section.subscriptions.content'],
    ['refund.section.process.title','refund.section.process.content'],
    ['refund.section.law.title','refund.section.law.content'],
  ];
  return (
  <div className="min-h-dvh flex flex-col bg-background">
      <Header />
    <main className="container mx-auto flex-1 px-4 py-8 md:py-10 prose prose-invert prose-headings:text-foreground prose-p:text-foreground/90 max-w-3xl">
  <h1 className="not-prose text-3xl md:text-4xl font-bold anchor-offset">{t('refund.title')}</h1>
        <p className="text-muted-foreground -mt-4 mb-6">{t('refund.subtitle')}</p>
        <p>{t('refund.intro')}</p>
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
