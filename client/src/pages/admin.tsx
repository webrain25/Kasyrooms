import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Model } from "@shared/schema";
import { useAuth } from "@/lib/authContext";

type Report = { id: string; modelId: string; userId: string; reason: string; details?: string; when: string };

export default function AdminDashboard() {
  const { user, isLoading, token } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [audit, setAudit] = useState<Array<{ id:string; when:string; actor?:string; role?:string; action:string; target?:string }>>([]);
  const [dmca, setDmca] = useState<Array<{ id:string; reporterName:string; reporterEmail:string; originalContentUrl:string; infringingUrls:string[]; status:string; createdAt:string; notes?:string }>>([]);
  const [kycApps, setKycApps] = useState<Array<{ id:string; userId?:string; fullName:string; status:string; createdAt:string; documentType?:string; documentFrontUrl?: string; documentBackUrl?: string; selfieUrl?: string }>>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [blockUserId, setBlockUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const isAllowed = user?.role === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const headers: Record<string,string> = {};
        if (user?.id && user.role) { headers['x-user-id'] = user.id; headers['x-role'] = user.role; }
        const m = await fetch('/api/models', { headers });
        const ml = await m.json();
        setModels(ml || []);
        const authHeaders: Record<string,string> = { ...headers };
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;
        const r = await fetch('/api/moderation/reports', { headers: authHeaders });
        const rl = await r.json();
        setReports(Array.isArray(rl) ? rl : []);
        // Audit
        const a = await fetch('/api/operator/audit?limit=200', { headers: authHeaders });
        const al = await a.json();
        setAudit(Array.isArray(al) ? al : []);
        // DMCA
        try {
          const d = await fetch('/api/operator/dmca', { headers: authHeaders });
          const dl = await d.json();
          setDmca(Array.isArray(dl) ? dl : []);
        } catch {}
        // KYC
        try {
          const k = await fetch('/api/operator/kyc', { headers: authHeaders });
          const kl = await k.json();
          setKycApps(Array.isArray(kl) ? kl : []);
        } catch {}
      } finally { setLoading(false); }
    })();
  }, [user?.id, user?.role, token]);

  const commonHeaders = () => {
    const headers: Record<string,string> = {};
    if (user?.id && user.role) { headers['x-user-id'] = user.id; headers['x-role'] = user.role; }
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadBlocks = async (modelId: string) => {
    if (!modelId) { setBlocks([]); return; }
    try {
      const r = await fetch(`/api/moderation/blocks?modelId=${encodeURIComponent(modelId)}`, { headers: commonHeaders() });
      const j = await r.json();
      setBlocks(Array.isArray(j?.blocks) ? j.blocks : []);
    } catch { setBlocks([]); }
  };

  useEffect(() => {
    loadBlocks(selectedModelId);
  }, [selectedModelId]);

  if (!isAllowed && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted">Area riservata all'admin. Effettua login come "admin".</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Models</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {models.map(m => (
                  <div key={m.id} className="p-3 border border-border rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.profileImage?.startsWith('http') ? `/api/proxy/img?u=${encodeURIComponent(m.profileImage)}` : (m.profileImage || '/logo.png')}
                        className="w-12 h-12 rounded object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e)=>{ const el=e.currentTarget; el.onerror=null; el.src='/logo.png'; }}
                      />
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted">{m.isOnline ? 'Online' : 'Offline'} {m.isBusy ? '(Busy)' : ''}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted">
                      Shows: <span className="font-semibold">{m.privateShows ?? 0}</span> · Hours: <span className="font-semibold">{m.hoursOnline ?? 0}</span>
                    </div>
                  </div>
                ))}
                {models.length === 0 && <p className="text-sm text-muted">No models</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Moderation Reports</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="p-3 border border-border rounded-md">
                    <div className="text-sm"><span className="font-semibold">Model:</span> {r.modelId} · <span className="font-semibold">User:</span> {r.userId}</div>
                    <div className="text-sm"><span className="font-semibold">Reason:</span> {r.reason}</div>
                    {r.details && <div className="text-xs text-muted">{r.details}</div>}
                    <div className="text-xs text-muted">{new Date(r.when).toLocaleString()}</div>
                  </div>
                ))}
                {reports.length === 0 && <p className="text-sm text-muted">No reports</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Audit Log</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {audit.map(ev => (
                  <div key={ev.id} className="p-2 border border-border rounded text-sm flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div><span className="text-muted">Action:</span> <span className="font-medium">{ev.action}</span></div>
                      <div className="text-xs text-muted">{new Date(ev.when).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted text-right">
                      {ev.actor && <div>by {ev.actor}{ev.role ? ` (${ev.role})` : ''}</div>}
                      {ev.target && <div>target: {ev.target}</div>}
                    </div>
                  </div>
                ))}
                {audit.length === 0 && <div className="text-sm text-muted">No audit events</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Blocks management</CardTitle></CardHeader>
              <CardContent className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">DMCA Notices</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {dmca.map(n => (
                  <div key={n.id} className="p-3 border border-border rounded-md text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{n.reporterName}</div>
                      <div className="text-xs rounded px-2 py-0.5 bg-card border border-border">{n.status}</div>
                    </div>
                    <div className="text-xs text-muted">Email: {n.reporterEmail}</div>
                    <div className="text-xs truncate"><span className="text-muted">Original:</span> <a href={n.originalContentUrl} target="_blank" rel="noreferrer" className="underline">{n.originalContentUrl}</a></div>
                    <div className="text-xs"><span className="text-muted">Infringing:</span> {n.infringingUrls.slice(0,3).map(u => <a key={u} href={u} target="_blank" rel="noreferrer" className="underline mr-1">{u}</a>)}{n.infringingUrls.length>3 && <span>…(+{n.infringingUrls.length-3})</span>}</div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={async ()=>{ await fetch(`/api/operator/dmca/${n.id}/status`, { method:'PATCH', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ status: 'closed' }) });
                        // refresh
                        try { const d = await fetch('/api/operator/dmca', { headers: commonHeaders() }); const dl = await d.json(); setDmca(Array.isArray(dl)?dl:[]);} catch {} }}>Close</Button>
                      <Button size="sm" variant="destructive" onClick={async ()=>{ await fetch(`/api/operator/dmca/${n.id}/status`, { method:'PATCH', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
                        try { const d = await fetch('/api/operator/dmca', { headers: commonHeaders() }); const dl = await d.json(); setDmca(Array.isArray(dl)?dl:[]);} catch {} }}>Reject</Button>
                    </div>
                  </div>
                ))}
                {dmca.length === 0 && <p className="text-sm text-muted">No DMCA notices</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">KYC Applications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {kycApps.map(k => (
                  <div key={k.id} className="p-3 border border-border rounded-md text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{k.fullName}</div>
                      <div className="text-xs rounded px-2 py-0.5 bg-card border border-border">{k.status}</div>
                    </div>
                    {k.userId && <div className="text-xs text-muted">User: {k.userId}</div>}
                    <div className="text-xs text-muted">Doc: {k.documentType || 'n/a'}</div>
                    {(k.documentFrontUrl || k.documentBackUrl || k.selfieUrl) && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <KycThumb label="Front" url={k.documentFrontUrl} />
                        <KycThumb label="Back" url={k.documentBackUrl} />
                        <KycThumb label="Selfie" url={k.selfieUrl} />
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={async ()=>{ await fetch(`/api/operator/kyc/${k.id}/status`, { method:'PATCH', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ status: 'approved' }) });
                        try { const r = await fetch('/api/operator/kyc', { headers: commonHeaders() }); const rl = await r.json(); setKycApps(Array.isArray(rl)?rl:[]);} catch {} }}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={async ()=>{ await fetch(`/api/operator/kyc/${k.id}/status`, { method:'PATCH', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
                        try { const r = await fetch('/api/operator/kyc', { headers: commonHeaders() }); const rl = await r.json(); setKycApps(Array.isArray(rl)?rl:[]);} catch {} }}>Reject</Button>
                    </div>
                  </div>
                ))}
                {kycApps.length === 0 && <p className="text-sm text-muted">No KYC applications</p>}
              </CardContent>
            </Card>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Model</label>
                    <select value={selectedModelId} onChange={(e)=>setSelectedModelId(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-sm">
                      <option value="">Select a model…</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">User ID to block</label>
                    <input value={blockUserId} onChange={(e)=>setBlockUserId(e.target.value)} placeholder="e.g. u-001" className="w-full px-3 py-2 rounded-md bg-card border border-border text-sm" />
                  </div>
                  <Button onClick={async ()=>{
                    if (!selectedModelId || !blockUserId.trim()) return;
                    try {
                      await fetch('/api/moderation/block', { method:'POST', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ modelId: selectedModelId, userId: blockUserId.trim() })});
                      setBlockUserId('');
                      loadBlocks(selectedModelId);
                    } catch {}
                  }}>Block</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted">{selectedModelId ? `Blocks for ${selectedModelId}` : 'Select a model to manage blocks'}</div>
                  {selectedModelId && <Button variant="outline" size="sm" onClick={()=>loadBlocks(selectedModelId)}>Refresh</Button>}
                </div>
                {selectedModelId && (
                  <div className="space-y-2">
                    {blocks.map(uid => (
                      <div key={uid} className="p-2 rounded border border-border flex items-center justify-between text-sm">
                        <div><span className="text-muted mr-2">User:</span><span className="font-medium">{uid}</span></div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={async ()=>{
                            try { await fetch('/api/moderation/unblock', { method:'POST', headers:{ ...commonHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ modelId: selectedModelId, userId: uid }) }); loadBlocks(selectedModelId); } catch {}
                          }}>Unblock</Button>
                        </div>
                      </div>
                    ))}
                    {blocks.length === 0 && <div className="text-sm text-muted">No users blocked</div>}
                  </div>
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

function KycThumb({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      {url ? (
        <img src={url} className="w-full h-16 object-cover rounded border border-border" />
      ) : (
        <div className="w-full h-16 flex items-center justify-center text-[10px] bg-muted rounded border border-dashed border-border text-muted-foreground">n/a</div>
      )}
    </div>
  );
}
