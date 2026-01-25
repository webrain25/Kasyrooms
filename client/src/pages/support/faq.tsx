import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
  const { t } = useI18n();
  const questions = Array.from({ length: 10 }, (_, i) => `faq.q${i + 1}`);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('faq.intro')}</p>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {questions.map((k, idx) => (
            <AccordionItem
              key={k}
              value={k}
              className="border-b-0 rounded-lg border border-border bg-card px-6"
            >
              <AccordionTrigger className="hover:no-underline">{t(k)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t(`faq.a${idx + 1}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 text-sm text-muted-foreground">
          {t('faq.stillNeed')} <a href="/contact" className="text-primary hover:underline">{t('contact.title')}</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}