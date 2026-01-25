import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  const { t } = useI18n();
  const questions = Array.from({ length: 10 }, (_, i) => `faq.q${i + 1}`);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{t('faq.title')}</h1>
        <p className="mb-6 text-muted">{t('faq.intro')}</p>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((k, idx) => (
            <AccordionItem key={k} value={k}>
              <AccordionTrigger>{t(k)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t(`faq.a${idx + 1}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
