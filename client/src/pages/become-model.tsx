import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Star, DollarSign, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function BecomeModelPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const wizardRef = useRef<HTMLDivElement | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<{ front?: boolean; back?: boolean; selfie?: boolean }>({});

  const [applicationId, setApplicationId] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [documentType, setDocumentType] = useState<'passport'|'id_card'|'driver_license'|''>("");
  const [notes, setNotes] = useState("");

  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const storageKey = 'kr_become_model_kyc_v1';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        if (typeof saved.applicationId === 'string') setApplicationId(saved.applicationId);
        if (typeof saved.fullName === 'string') setFullName(saved.fullName);
        if (typeof saved.dateOfBirth === 'string') setDateOfBirth(saved.dateOfBirth);
        if (typeof saved.country === 'string') setCountry(saved.country);
        if (typeof saved.documentType === 'string') setDocumentType(saved.documentType);
        if (typeof saved.notes === 'string') setNotes(saved.notes);
        if (typeof saved.documentFrontUrl === 'string') setDocumentFrontUrl(saved.documentFrontUrl);
        if (typeof saved.documentBackUrl === 'string') setDocumentBackUrl(saved.documentBackUrl);
        if (typeof saved.selfieUrl === 'string') setSelfieUrl(saved.selfieUrl);
        if (saved.applicationId) {
          setShowWizard(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const payload = {
        applicationId,
        fullName,
        dateOfBirth,
        country,
        documentType,
        notes,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [applicationId, fullName, dateOfBirth, country, documentType, notes, documentFrontUrl, documentBackUrl, selfieUrl]);

  const stepLabels = useMemo(
    () => [
      t('becomeModel.stepTitle') + ' 1',
      t('becomeModel.stepTitle') + ' 2',
      t('becomeModel.stepTitle') + ' 3',
      t('becomeModel.stepTitle') + ' 4',
    ],
    [t]
  );

  const ensureApplication = async () => {
    if (applicationId) return applicationId;
    if (!fullName.trim()) {
      toast({ title: 'Validation', description: 'Full name required', variant: 'destructive' });
      throw new Error('full_name_required');
    }
    if (!documentType) {
      toast({ title: 'Validation', description: 'Select a document type', variant: 'destructive' });
      throw new Error('document_type_required');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth: dateOfBirth || undefined,
          country: country || undefined,
          documentType,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const created = await res.json();
      const id = String(created?.id || '');
      if (!id) throw new Error('missing_application_id');
      setApplicationId(id);
      toast({ title: 'Submitted', description: 'Application created. Continue with document uploads.' });
      return id;
    } finally {
      setSubmitting(false);
    }
  };

  const doUpload = async (kind: 'front' | 'back' | 'selfie', file: File | null) => {
    const appId = await ensureApplication();
    if (!file) {
      toast({ title: 'No file selected', description: 'Choose an image file to upload.', variant: 'destructive' });
      return;
    }
    setUploading((prev) => ({ ...prev, [kind]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/kyc/${encodeURIComponent(appId)}/upload?kind=${encodeURIComponent(kind)}`, {
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
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || String(e), variant: 'destructive' });
      throw e;
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const resetWizard = () => {
    setStep(0);
    setApplicationId('');
    setFullName('');
    setDateOfBirth('');
    setCountry('');
    setDocumentType('');
    setNotes('');
    setDocumentFrontUrl('');
    setDocumentBackUrl('');
    setSelfieUrl('');
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const requirements = [
    'becomeModel.requirements.0',
    'becomeModel.requirements.1',
    'becomeModel.requirements.2',
    'becomeModel.requirements.3'
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'becomeModel.benefits.0.title',
      description: 'becomeModel.benefits.0.description'
    },
    {
      icon: Star,
      title: 'becomeModel.benefits.1.title', 
      description: 'becomeModel.benefits.1.description'
    },
    {
      icon: Users,
      title: 'becomeModel.benefits.2.title',
      description: 'becomeModel.benefits.2.description'
    },
    {
      icon: Camera,
      title: 'becomeModel.benefits.3.title',
      description: 'becomeModel.benefits.3.description'
    }
  ];

  const steps = [
    'becomeModel.steps.0',
    'becomeModel.steps.1',
    'becomeModel.steps.2',
    'becomeModel.steps.3'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('becomeModel.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('becomeModel.subtitle')}
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.benefitsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <benefit.icon className="w-8 h-8 text-pink-500 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">{t(benefit.title)}</h3>
                      <p className="text-muted-foreground">{t(benefit.description)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.requirementsTitle')}</h2>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <span>{t(requirement)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How to Start Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('becomeModel.stepsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{t('becomeModel.stepTitle')} {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(step)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('becomeModel.ctaTitle')}</h2>
          <p className="text-xl mb-6">{t('becomeModel.ctaSubtitle')}</p>
          <Button
            size="lg"
            variant="secondary"
            className="text-black"
            onClick={() => {
              setShowWizard(true);
              setTimeout(() => wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }}
          >
            {t('becomeModel.ctaButton')}
          </Button>
        </div>

        {/* 4-Step Wizard (KYC) */}
        {showWizard && (
          <div ref={wizardRef} className="mt-10">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Application (4 steps)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={
                        'px-3 py-1 rounded-full text-xs border ' +
                        (step === i
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-transparent text-muted-foreground border-border')
                      }
                    >
                      {stepLabels[i]}
                    </div>
                  ))}
                </div>

                {step === 0 && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Full Name</label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Date of Birth</label>
                        <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Country</label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="IT" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Document Type</label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-md bg-card border border-border text-sm"
                        >
                          <option value="">Select…</option>
                          <option value="passport">Passport</option>
                          <option value="id_card">ID Card</option>
                          <option value="driver_license">Driver License</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Notes (optional)</label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything to add" />
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <Button variant="outline" onClick={() => setShowWizard(false)}>Close</Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={resetWizard}>Reset</Button>
                        <Button
                          onClick={async () => {
                            try {
                              await ensureApplication();
                              setStep(1);
                            } catch {
                              // errors already toasted
                            }
                          }}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting…' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                    {applicationId && (
                      <div className="text-xs text-muted-foreground">Application ID: <span className="font-mono">{applicationId}</span></div>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <UploadStep
                    title="Upload document front"
                    currentUrl={documentFrontUrl}
                    busy={!!uploading.front}
                    onBack={() => setStep(0)}
                    onNext={async (file) => {
                      await doUpload('front', file);
                      setStep(2);
                    }}
                  />
                )}

                {step === 2 && (
                  <UploadStep
                    title="Upload document back"
                    currentUrl={documentBackUrl}
                    busy={!!uploading.back}
                    onBack={() => setStep(1)}
                    onNext={async (file) => {
                      await doUpload('back', file);
                      setStep(3);
                    }}
                  />
                )}

                {step === 3 && (
                  <UploadStep
                    title="Upload selfie"
                    currentUrl={selfieUrl}
                    busy={!!uploading.selfie}
                    onBack={() => setStep(2)}
                    nextLabel="Finish"
                    onNext={async (file) => {
                      await doUpload('selfie', file);
                      toast({ title: 'Done', description: 'Application completed. Our team will review it soon.' });
                    }}
                  >
                    <div className="mt-4 rounded-md border border-border p-3 text-sm text-muted-foreground">
                      <div className="font-medium text-foreground mb-1">Summary</div>
                      <div>Application ID: <span className="font-mono">{applicationId || '—'}</span></div>
                      <div>Full Name: {fullName || '—'}</div>
                      <div>Document Type: {documentType || '—'}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" onClick={resetWizard}>Start over</Button>
                    </div>
                  </UploadStep>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function UploadStep({
  title,
  currentUrl,
  busy,
  onBack,
  onNext,
  nextLabel,
  children,
}: {
  title: string;
  currentUrl?: string;
  busy?: boolean;
  onBack: () => void;
  onNext: (file: File | null) => Promise<void>;
  nextLabel?: string;
  children?: React.ReactNode;
}) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <div className="text-sm font-medium mb-3">{title}</div>
      {currentUrl ? (
        <img src={currentUrl} className="w-full h-48 object-cover rounded mb-3 border border-border" />
      ) : (
        <div className="w-full h-48 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground mb-3 border border-border">
          No image
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-xs"
      />
      <div className="flex items-center justify-between gap-3 pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button
          onClick={async () => {
            await onNext(file);
          }}
          disabled={busy}
        >
          {busy ? 'Uploading…' : (nextLabel || 'Upload & Continue')}
        </Button>
      </div>
      {children}
    </div>
  );
}
