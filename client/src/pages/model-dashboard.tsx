import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

export default function ModelDashboard() {
  const { user, isAuthenticated, token } = useAuth();
  const [profile, setProfile] = useState<{ displayName?: string } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    // demo: assume model id == user.id
    (async () => {
      try {
        const headers: Record<string,string> = { 'x-user-id': user.id, 'x-role': user.role || '' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const r = await fetch(`/api/models/${user.id}`, { headers });
        if (r.ok) {
          const m = await r.json();
          setProfile({ displayName: m.name });
        }
        const p = await fetch(`/api/models/${user.id}/photos`, { headers });
        const pj = await p.json();
        setPhotos(Array.isArray(pj.photos) ? pj.photos : []);
      } catch {}
    })();
  }, [user?.id, user?.role, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Please log in</p>
          <Button onClick={() => (window.location.href = '/login')}>Login</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const saveProfile = async () => {
    if (!user) return;
    if (user.role !== 'model') { alert('Solo modella può modificare il profilo'); return; }
    setBusy(true);
    try {
  const headers: Record<string,string> = {'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`/api/models/${user.id}`, { method:'PATCH', headers, body: JSON.stringify({ name: profile?.displayName }) });
      alert('Saved');
    } finally { setBusy(false); }
  };

  const addPhoto = async () => {
    if (!user || !photoUrl.trim()) return;
    if (user.role !== 'model') { alert('Solo modella può aggiungere foto'); return; }
    setBusy(true);
    try {
  const headers: Record<string,string> = {'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`/api/models/${user.id}/photos`, { method:'POST', headers, body: JSON.stringify({ url: photoUrl.trim() }) });
      const j = await r.json();
      setPhotos(Array.isArray(j.photos) ? j.photos : []);
      setPhotoUrl("");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Model Dashboard</h1>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-40 text-sm text-muted">Display Name</label>
              <input value={profile?.displayName || ''} onChange={e=>setProfile({ displayName: e.target.value })} className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm" />
            </div>
            <Button onClick={saveProfile} disabled={busy}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Photos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="Image URL" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm" />
              <Button onClick={addPhoto} disabled={busy || !photoUrl.trim()}>Add</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p,i) => (
                <img key={i} src={p} className="w-full aspect-square object-cover rounded" />
              ))}
              {photos.length === 0 && <p className="text-sm text-muted">No photos yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
