import Header from "@/components/header";
import Footer from "@/components/footer";
import { useI18n } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">{t('contact.title')}</h1>
        <p className="text-muted-foreground mb-6">{t('contact.subtitle')}</p>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">{t('contact.form.name')}</label>
            <input id="name" name="name" className="w-full px-3 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
            <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">{t('contact.form.email')}</label>
            <input id="email" name="email" type="email" className="w-full px-3 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="message">{t('contact.form.message')}</label>
            <textarea id="message" name="message" rows={5} className="w-full px-3 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors">
            {t('contact.form.send')}
          </button>
        </form>
        <div className="mt-8 text-sm text-muted-foreground">
          Email: <a href="mailto:info@kasyrooms.com" className="text-primary hover:underline">info@kasyrooms.com</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
