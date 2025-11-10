import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";

export default function KycOnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [documentType, setDocumentType] = useState<'passport'|'id_card'|'driver_license'|''>("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string>("");
  const [uploading, setUploading] = useState<{ front?: boolean; back?: boolean; selfie?: boolean }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast({ title: 'Validation', description: 'Full name required', variant: 'destructive' }); return; }
    if (!documentType) { toast({ title: 'Validation', description: 'Select a document type', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, dateOfBirth, country, documentType, documentFrontUrl, documentBackUrl, selfieUrl, notes }) });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const created = await res.json();
      setApplicationId(created?.id || "");
      toast({ title: 'Submitted', description: 'KYC application created. You can now upload images.' });
      // Keep fields so the user can still edit URLs if desired, but clear notes
      setNotes('');
    } catch (e:any) {
      toast({ title: 'Submission failed', description: e?.message || String(e), variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const doUpload = async (kind: 'front'|'back'|'selfie', file: File | null) => {
    if (!applicationId) { toast({ title: 'Missing application', description: 'Submit the KYC form first to get an application ID.', variant: 'destructive' }); return; }
    if (!file) { toast({ title: 'No file selected', description: 'Choose an image file to upload.', variant: 'destructive' }); return; }
    setUploading(prev => ({ ...prev, [kind]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/kyc/${encodeURIComponent(applicationId)}/upload?kind=${encodeURIComponent(kind)}`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const j = await res.json();
      const app = j?.application;
      if (app?.documentFrontUrl) setDocumentFrontUrl(app.documentFrontUrl);
      if (app?.documentBackUrl) setDocumentBackUrl(app.documentBackUrl);
      if (app?.selfieUrl) setSelfieUrl(app.selfieUrl);
      toast({ title: 'Uploaded', description: `${kind} uploaded successfully.` });
    } catch (e:any) {
      toast({ title: 'Upload failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setUploading(prev => ({ ...prev, [kind]: false }));
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 md:py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>KYC Onboarding {user ? `(Logged as ${user.username})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Full Name</label>
                <Input value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Date of Birth</label>
                  <Input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Country</label>
                  <Input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Document Type</label>
                  <select value={documentType} onChange={e=>setDocumentType(e.target.value as any)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-sm">
                    <option value="">Select…</option>
                    <option value="passport">Passport</option>
                    <option value="id_card">ID Card</option>
                    <option value="driver_license">Driver License</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Document Front URL</label>
                  <Input type="url" value={documentFrontUrl} onChange={e=>setDocumentFrontUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Document Back URL</label>
                  <Input type="url" value={documentBackUrl} onChange={e=>setDocumentBackUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Selfie URL</label>
                  <Input type="url" value={selfieUrl} onChange={e=>setSelfieUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Notes (optional)</label>
                <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Anything to add" />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</Button>
              </div>
            </form>
            {applicationId && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="text-sm text-muted-foreground">Application ID: <span className="font-mono">{applicationId}</span></div>
                <div className="grid md:grid-cols-3 gap-4">
                  <KycUploadTile
                    title="Front"
                    currentUrl={documentFrontUrl}
                    onUpload={(file)=>doUpload('front', file)}
                    loading={!!uploading.front}
                  />
                  <KycUploadTile
                    title="Back"
                    currentUrl={documentBackUrl}
                    onUpload={(file)=>doUpload('back', file)}
                    loading={!!uploading.back}
                  />
                  <KycUploadTile
                    title="Selfie"
                    currentUrl={selfieUrl}
                    onUpload={(file)=>doUpload('selfie', file)}
                    loading={!!uploading.selfie}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function KycUploadTile({ title, currentUrl, onUpload, loading }: { title: string; currentUrl?: string; onUpload: (file: File|null)=>void; loading?: boolean }) {
  const [file, setFile] = useState<File|null>(null);
  return (
    <div className="p-3 border border-border rounded-md">
      <div className="text-sm font-medium mb-2">{title}</div>
      {currentUrl ? (
        <img src={currentUrl} className="w-full h-32 object-cover rounded mb-2" />
      ) : (
        <div className="w-full h-32 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground mb-2">No image</div>
      )}
      <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
      <div className="pt-2">
        <Button size="sm" onClick={()=>onUpload(file)} disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</Button>
      </div>
    </div>
  );
}
