import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DmcaSubmitPage() {
  const { toast } = useToast();
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
      toast({ title: "Validation", description: "Add at least one infringing URL.", variant: "destructive" });
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
      toast({ title: "Submitted", description: "DMCA notice submitted. We'll review shortly." });
      setReporterName(""); setReporterEmail(""); setOriginalContentUrl(""); setInfringingUrlsText(""); setSignature(""); setNotes("");
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message || String(e), variant: "destructive" });
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
            <CardTitle>Submit a DMCA Takedown Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Your Name</label>
                <Input value={reporterName} onChange={e=>setReporterName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Your Email</label>
                <Input type="email" value={reporterEmail} onChange={e=>setReporterEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Original Content URL</label>
                <Input type="url" value={originalContentUrl} onChange={e=>setOriginalContentUrl(e.target.value)} required placeholder="https://your-site.com/original" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Infringing URLs (one per line or comma-separated)</label>
                <Textarea value={infringingUrlsText} onChange={e=>setInfringingUrlsText(e.target.value)} rows={4} required placeholder="https://example.com/infringing-1\nhttps://example.com/infringing-2" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Signature (type your full name)</label>
                <Input value={signature} onChange={e=>setSignature(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Additional Notes (optional)</label>
                <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Context or clarification" />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Notice'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
