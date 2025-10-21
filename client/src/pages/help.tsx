import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

export default function Help() {
  const { t } = useI18n();

  const categories = [
    {
      title: 'help.categories.account.title',
      items: [
        { question: 'help.categories.account.items.0.question', answer: 'help.categories.account.items.0.answer' },
        { question: 'help.categories.account.items.1.question', answer: 'help.categories.account.items.1.answer' },
        { question: 'help.categories.account.items.2.question', answer: 'help.categories.account.items.2.answer' }
      ]
    },
    {
      title: 'help.categories.payment.title',
      items: [
        { question: 'help.categories.payment.items.0.question', answer: 'help.categories.payment.items.0.answer' },
        { question: 'help.categories.payment.items.1.question', answer: 'help.categories.payment.items.1.answer' },
        { question: 'help.categories.payment.items.2.question', answer: 'help.categories.payment.items.2.answer' }
      ]
    },
    {
      title: 'help.categories.streaming.title',
      items: [
        { question: 'help.categories.streaming.items.0.question', answer: 'help.categories.streaming.items.0.answer' },
        { question: 'help.categories.streaming.items.1.question', answer: 'help.categories.streaming.items.1.answer' },
        { question: 'help.categories.streaming.items.2.question', answer: 'help.categories.streaming.items.2.answer' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('help.title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('help.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {categories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-2xl">{t(category.title)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {t(item.question)}
                      </AccordionTrigger>
                      <AccordionContent>
                        {t(item.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}