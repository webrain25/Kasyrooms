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
      } finally { setLoading(false); }
    })();
  }, [user?.id, user?.role, token]);

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
                      <img src={m.profileImage} className="w-12 h-12 rounded object-cover" />
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
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
