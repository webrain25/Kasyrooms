import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { useI18n } from "@/lib/i18n";

export default function KycOnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
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
    if (!fullName.trim()) { toast({ title: t('kyc.validation.title'), description: t('kyc.validation.fullName'), variant: 'destructive' }); return; }
    if (!documentType) { toast({ title: t('kyc.validation.title'), description: t('kyc.validation.docType'), variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, dateOfBirth, country, documentType, documentFrontUrl, documentBackUrl, selfieUrl, notes }) });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const created = await res.json();
      setApplicationId(created?.id || "");
      toast({ title: t('kyc.submitted.title'), description: t('kyc.submitted.desc') });
      // Keep fields so the user can still edit URLs if desired, but clear notes
      setNotes('');
    } catch (e:any) {
      toast({ title: t('kyc.submissionFailed.title'), description: e?.message || String(e), variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const doUpload = async (kind: 'front'|'back'|'selfie', file: File | null) => {
    if (!applicationId) { toast({ title: t('kyc.upload.missingApp.title'), description: t('kyc.upload.missingApp.desc'), variant: 'destructive' }); return; }
    if (!file) { toast({ title: t('kyc.upload.noFile.title'), description: t('kyc.upload.noFile.desc'), variant: 'destructive' }); return; }
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
      toast({
        title: t('kyc.uploaded.title'),
        description: `${t(`kyc.upload.kind.${kind}`)} ${t('kyc.uploaded.descSuffix')}`,
      });
    } catch (e:any) {
      toast({ title: t('kyc.uploadFailed.title'), description: e?.message || String(e), variant: 'destructive' });
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
            <CardTitle>
              {t('kyc.title')} {user ? `(${t('kyc.loggedAs')} ${user.username})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.fullName')}</label>
                <Input value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder={t('kyc.form.fullName.placeholder')} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.dob')}</label>
                  <Input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.country')}</label>
                  <Input value={country} onChange={e=>setCountry(e.target.value)} placeholder={t('kyc.form.country.placeholder')} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.docType')}</label>
                  <select value={documentType} onChange={e=>setDocumentType(e.target.value as any)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-sm">
                    <option value="">{t('kyc.form.docType.select')}</option>
                    <option value="passport">{t('kyc.form.docType.passport')}</option>
                    <option value="id_card">{t('kyc.form.docType.idCard')}</option>
                    <option value="driver_license">{t('kyc.form.docType.driver')}</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.docFrontUrl')}</label>
                  <Input type="url" value={documentFrontUrl} onChange={e=>setDocumentFrontUrl(e.target.value)} placeholder={t('kyc.form.url.placeholder')} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.docBackUrl')}</label>
                  <Input type="url" value={documentBackUrl} onChange={e=>setDocumentBackUrl(e.target.value)} placeholder={t('kyc.form.url.placeholder')} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.selfieUrl')}</label>
                  <Input type="url" value={selfieUrl} onChange={e=>setSelfieUrl(e.target.value)} placeholder={t('kyc.form.url.placeholder')} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">{t('kyc.form.notes')}</label>
                <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder={t('kyc.form.notes.placeholder')} />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? t('kyc.form.submitting') : t('kyc.form.submit')}</Button>
              </div>
            </form>
            {applicationId && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="text-sm text-muted-foreground">{t('kyc.applicationId')}: <span className="font-mono">{applicationId}</span></div>
                <div className="grid md:grid-cols-3 gap-4">
                  <KycUploadTile
                    title={t('kyc.upload.kind.front')}
                    currentUrl={documentFrontUrl}
                    onUpload={(file)=>doUpload('front', file)}
                    loading={!!uploading.front}
                  />
                  <KycUploadTile
                    title={t('kyc.upload.kind.back')}
                    currentUrl={documentBackUrl}
                    onUpload={(file)=>doUpload('back', file)}
                    loading={!!uploading.back}
                  />
                  <KycUploadTile
                    title={t('kyc.upload.kind.selfie')}
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
  const { t } = useI18n();
  return (
    <div className="p-3 border border-border rounded-md">
      <div className="text-sm font-medium mb-2">{title}</div>
      {currentUrl ? (
        <img src={currentUrl} className="w-full h-32 object-cover rounded mb-2" />
      ) : (
        <div className="w-full h-32 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground mb-2">{t('kyc.noImage')}</div>
      )}
      <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
      <div className="pt-2">
        <Button size="sm" onClick={()=>onUpload(file)} disabled={loading}>{loading ? t('kyc.uploading') : t('kyc.upload')}</Button>
      </div>
    </div>
  );
}
