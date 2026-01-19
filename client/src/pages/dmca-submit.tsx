import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export default function DmcaSubmitPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [originalContentUrl, setOriginalContentUrl] = useState("");
  const [infringingUrlsText, setInfringingUrlsText] = useState("");
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const infringingUrls = infringingUrlsText
      .split(/\n|,/) // split by new lines or commas
      .map(s => s.trim())
      .filter(Boolean);
    if (infringingUrls.length === 0) {
      toast({ title: t("dmcaSubmit.validation.title"), description: t("dmcaSubmit.validation.noUrls"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/dmca/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterName, reporterEmail, originalContentUrl, infringingUrls, signature, notes })
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      toast({ title: t("dmcaSubmit.submitted.title"), description: t("dmcaSubmit.submitted.desc") });
      setReporterName(""); setReporterEmail(""); setOriginalContentUrl(""); setInfringingUrlsText(""); setSignature(""); setNotes("");
    } catch (e: any) {
      toast({ title: t("dmcaSubmit.failed.title"), description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 md:py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("dmcaSubmit.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.name")}</label>
                <Input value={reporterName} onChange={e=>setReporterName(e.target.value)} required placeholder={t("dmcaSubmit.placeholder.name")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.email")}</label>
                <Input type="email" value={reporterEmail} onChange={e=>setReporterEmail(e.target.value)} required placeholder={t("dmcaSubmit.placeholder.email")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.originalUrl")}</label>
                <Input type="url" value={originalContentUrl} onChange={e=>setOriginalContentUrl(e.target.value)} required placeholder={t("dmcaSubmit.placeholder.originalUrl")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.infringingUrls")}</label>
                <Textarea value={infringingUrlsText} onChange={e=>setInfringingUrlsText(e.target.value)} rows={4} required placeholder={t("dmcaSubmit.placeholder.infringingUrls")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.signature")}</label>
                <Input value={signature} onChange={e=>setSignature(e.target.value)} required placeholder={t("dmcaSubmit.placeholder.signature")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t("dmcaSubmit.form.notes")}</label>
                <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder={t("dmcaSubmit.placeholder.notes")} />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? t("dmcaSubmit.form.submitting") : t("dmcaSubmit.form.submit")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
