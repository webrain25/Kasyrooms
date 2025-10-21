import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function DmcaPage() {
  const { t } = useI18n();
  return (
  <div className="min-h-dvh flex flex-col bg-background">
      <Header />
    <main className="container mx-auto flex-1 px-4 py-8 md:py-10 prose prose-invert prose-headings:text-foreground prose-p:text-foreground/90 max-w-3xl">
  <h1 className="not-prose text-3xl md:text-4xl font-bold anchor-offset">{t('dmca.title')}</h1>
        <p className="text-muted-foreground -mt-4 mb-6">{t('dmca.subtitle')}</p>
        <section>
          <p>{t('dmca.intro')}</p>
        </section>
        <section>
          <h2>{t('dmca.notice.title')}</h2>
          <p>{t('dmca.notice.content')}</p>
        </section>
        <section>
          <h2>{t('dmca.counter.title')}</h2>
          <p>{t('dmca.counter.content')}</p>
        </section>
        <section>
          <h2>{t('dmca.repeat.title')}</h2>
          <p>{t('dmca.repeat.content')}</p>
        </section>
        <section>
          <h2>{t('dmca.misuse.title')}</h2>
          <p>{t('dmca.misuse.content')}</p>
        </section>
        <section>
          <h2>{t('dmca.contact.title')}</h2>
          <p>{t('dmca.contact.content')}</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
