import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildImageUrl } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRTC } from "@/components/rtc/useRTC";
import { LocalPreview } from "@/components/rtc/LocalPreview";

export default function ModelDashboard() {
  const { user, isAuthenticated, token } = useAuth();
  const [profile, setProfile] = useState<{ displayName?: string } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [chat, setChat] = useState<Array<{ user: string; text: string; when?: string; userId_B?: string }>>([]);
  const [chatText, setChatText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [autoOnline, setAutoOnline] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);
  const [clearedAt, setClearedAt] = useState<number>(0);
  const lastChatSentAtRef = useRef<number>(0);
  const bannedRx = useRef<RegExp[]>([/(offensive|hate|slur)/i]);
  const displayName = useMemo(()=> profile?.displayName || user?.username || "Modella", [profile?.displayName, user?.username]);
  const { toast } = useToast();
  const [roomId, setRoomId] = useState<string>(user ? `model:${user.id}` : "");
  const rtc = useRTC(roomId, 'model');
  const isLive = !!rtc.localStream;
  const dialedRef = useRef<Set<string>>(new Set());

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
          setIsOnline(!!m.isOnline);
        }
    const p = await fetch(`/api/models/${user.id}/photos`, { headers });
        const pj = await p.json();
        setPhotos(Array.isArray(pj.photos) ? pj.photos : []);
        // load public chat
  const c = await fetch(`/api/chat/public?limit=50`);
        const cj = await c.json();
        if (Array.isArray(cj)) setChat(cj);
        // preferences
        try {
          const stored = localStorage.getItem(`model:autoOnline:${user.id}`);
          if (stored) setAutoOnline(stored === '1');
          const cAt = localStorage.getItem(`model:recentsClearedAt:${user.id}`);
          if (cAt) setClearedAt(Number(cAt));
        } catch {}
        setInitialized(true);
      } catch {}
    })();
  }, [user?.id, user?.role, token]);

  // If auto-online enabled, go online on first load
  useEffect(() => {
    if (!initialized || !user) return;
    if (autoOnline && !isOnline) toggleOnline(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // When going online, auto-join signaling room so viewers can connect
  useEffect(() => {
    if (!user) return;
    if (isOnline) {
      try { rtc.join(); } catch {}
    }
  }, [isOnline, user?.id]);

  // Switch to private session room when a session is active; otherwise public room
  useEffect(() => {
    if (!user) return;
    const targetRoom = sessionId ? `session:${sessionId}` : `model:${user.id}`;
    if (targetRoom !== roomId) {
      setRoomId(targetRoom);
      try { rtc.switchRoom(targetRoom); } catch {}
      // Attempt to (re)join to ensure we advertise presence
      try { rtc.join(); } catch {}
      // Reset dialed peers so we re-offer on new room
      dialedRef.current.clear();
    }
  }, [sessionId, user?.id]);

  // When we are live (have local stream), proactively call any peers present
  useEffect(() => {
    if (!isLive) { dialedRef.current.clear(); return; }
    rtc.peers.forEach(p => {
      if (!dialedRef.current.has(p.id)) {
        dialedRef.current.add(p.id);
        rtc.callPeer(p.id);
      }
    });
  }, [isLive, rtc.peers]);

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

  const uploadPhotoFile = async () => {
    if (!user || !photoFile) return;
    if (user.role !== 'model') { alert('Solo modella può aggiungere foto'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const headers: Record<string,string> = { 'x-user-id': user.id, 'x-role': user.role || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`/api/models/${user.id}/photos/upload`, { method:'POST', headers, body: fd as any });
      const j = await r.json();
      setPhotos(Array.isArray(j.photos) ? j.photos : []);
      setPhotoFile(null);
      try {
        const el = document.getElementById('photo-file') as HTMLInputElement | null;
        if (el) el.value = '';
      } catch {}
    } finally { setBusy(false); }
  };

  const toggleOnline = async (next: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`/api/models/${user.id}/status`, { method:'PATCH', headers, body: JSON.stringify({ isOnline: next }) });
      if (r.ok) setIsOnline(next);
    } finally { setBusy(false); }
  };

  const sendChat = async () => {
    if (!chatText.trim()) return;
    // Client-side bad-words filter
    if (bannedRx.current.some(rx => rx.test(chatText))) {
      toast({ title: 'Messaggio non inviato', description: 'Contiene parole vietate', variant: 'destructive' });
      return;
    }
    // Simple client-side rate limit: 1 message / 2s
    const now = Date.now();
    if (now - lastChatSentAtRef.current < 2000) return;
    lastChatSentAtRef.current = now;
    try {
  const r = await fetch('/api/chat/public', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user: displayName, text: chatText.trim(), userId_B: user?.id })});
      if (r.ok) {
        const msg = await r.json();
        setChat(prev => [msg, ...prev].slice(0, 50));
        setChatText("");
      }
    } catch {}
  };

  const startPrivate = async (userIdB: string) => {
    if (!userIdB.trim() || !user) return;
    setBusy(true);
    try {
      const r = await fetch('/api/sessions/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId_B: userIdB.trim(), modelId: user.id }) });
      const s = await r.json();
      if (s?.id) setSessionId(s.id);
      // mark busy true when private show starts
      if (s?.id) {
        setSessionId(s.id);
        toast({ title: 'Private Show avviato', description: `Sessione ${s.id}` });
      }
      await toggleOnline(true);
      const headers: Record<string,string> = { 'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/models/${user.id}/busy`, { method:'PATCH', headers, body: JSON.stringify({ isBusy: true }) });
    } finally { setBusy(false); }
  };

  const panic = async () => {
    if (!user) return;
    try {
      // Stop live stream immediately
      rtc.stopLocal();
      // Set busy false and go offline
      const headers: Record<string,string> = { 'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/models/${user.id}/busy`, { method:'PATCH', headers, body: JSON.stringify({ isBusy: false }) });
      await fetch(`/api/models/${user.id}/status`, { method:'PATCH', headers, body: JSON.stringify({ isOnline: false }) });
      // Create a moderation report entry for audit
      await fetch('/api/moderation/report', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ modelId: user.id, userId: user.id, reason: 'panic', details: `panic at ${new Date().toISOString()}` }) });
      toast({ title: 'Modalità panico attivata', description: 'Live fermata e segnalazione inviata' });
    } catch {}
  };

  const endPrivate = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/end`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ durationSec: 60, totalCharged: 2 }) });
  toast({ title: 'Private Show terminato' });
      setSessionId(null);
      if (user) {
        const headers: Record<string,string> = { 'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`/api/models/${user.id}/busy`, { method:'PATCH', headers, body: JSON.stringify({ isBusy: false }) });
      }
    } finally { setBusy(false); }
  };

  // Build recent chat users list (unique, excluding the model herself)
  const recentUsers = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ label: string; userId_B?: string; when?: string }> = [];
    for (const m of chat) {
      const label = String((m as any).user || '').trim();
      if (!label || label.toLowerCase() === String(displayName).toLowerCase()) continue;
      const when = (m as any).when ? Date.parse((m as any).when) : Date.now();
      if (clearedAt && when <= clearedAt) continue;
      if (seen.has(label)) continue;
      seen.add(label);
      list.push({ label, userId_B: (m as any).userId_B, when: (m as any).when });
      if (list.length >= 10) break;
    }
    return list;
  }, [chat, displayName, clearedAt]);

  const startPrivateByUsername = async (username: string) => {
    if (!user) return;
    setBusy(true);
    try {
      const r = await fetch('/api/sessions/start-by-username', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, modelId: user.id }) });
      const s = await r.json();
      if (s?.id) setSessionId(s.id);
      if (s?.id) {
        setSessionId(s.id);
        toast({ title: 'Private Show avviato', description: `Sessione ${s.id}` });
      }
      await toggleOnline(true);
      const headers: Record<string,string> = { 'Content-Type':'application/json', 'x-user-id': user.id, 'x-role': user.role || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/models/${user.id}/busy`, { method:'PATCH', headers, body: JSON.stringify({ isBusy: true }) });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">La tua Room</h1>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Stato Live</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`}></div>
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            <Button onClick={()=>toggleOnline(!isOnline)} disabled={busy} variant={isOnline ? 'secondary' : 'default'}>
              {isOnline ? 'Vai Offline' : 'Vai Online'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Live Stream</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="rounded-lg bg-black aspect-video overflow-hidden">
                <LocalPreview stream={rtc.localStream} />
              </div>
              <div className="space-y-3">
                <div className="text-sm text-muted">Stato: {isLive ? 'LIVE' : 'Spento'} | Peers connessi: {rtc.peers.length}</div>
                <div className="flex gap-2">
                  {!isLive ? (
                    <Button onClick={async ()=>{ await rtc.startLocal(); try { rtc.join(); } catch {}; dialedRef.current.clear(); }} disabled={!isOnline}>
                      Avvia Live
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={()=>{ rtc.stopLocal(); dialedRef.current.clear(); }}>
                      Ferma Live
                    </Button>
                  )}
                  <Button variant="outline" onClick={panic}>
                    Panic
                  </Button>
                  {!isOnline && <span className="text-xs text-destructive self-center">Devi essere Online per avviare la Live.</span>}
                </div>
                <div className="text-xs text-muted">Suggerimento: la Live invia la tua webcam ai visitatori collegati alla tua Room. Usa un TURN server per una migliore compatibilità NAT.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Preferenze</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">Auto-online all’ingresso</div>
              <div className="text-muted">Entra automaticamente online quando apri la Room</div>
            </div>
            <Switch
              checked={autoOnline}
              onCheckedChange={(val)=>{
                setAutoOnline(val);
                try { if (user) localStorage.setItem(`model:autoOnline:${user.id}`, val ? '1' : '0'); } catch {}
              }}
            />
          </CardContent>
        </Card>

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
            <div className="flex gap-2 items-center">
              <input id="photo-file" type="file" accept="image/*" onChange={e=>setPhotoFile(e.target.files?.[0] || null)} className="flex-1 text-sm" />
              <Button onClick={uploadPhotoFile} disabled={busy || !photoFile}>Upload</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p,i) => (
                <img
                  key={i}
                  src={buildImageUrl(p)}
                  className="w-full aspect-square object-cover rounded"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e)=>{ const el=e.currentTarget; el.onerror=null; el.src='/logo.png'; }}
                />
              ))}
              {photos.length === 0 && <p className="text-sm text-muted">No photos yet</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Chat Pubblica</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-56 overflow-auto rounded border border-border p-2 bg-card flex flex-col-reverse">
              <div className="space-y-1">
                {chat.map((m, i) => (
                  <div key={i} className="text-sm"><span className="text-gold-primary font-medium">{m.user}:</span> {m.text}</div>
                ))}
                {chat.length===0 && <div className="text-sm text-muted">Nessun messaggio</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <input value={chatText} onChange={e=>setChatText(e.target.value)} placeholder="Scrivi un messaggio" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm" />
              <Button onClick={sendChat} disabled={!chatText.trim()}>Invia</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Private Show</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!sessionId ? (
              <div className="flex gap-2 items-center">
                <input id="ps-user" placeholder="ID utente (es. u-001)" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm" />
                <Button onClick={()=>{
                  const el = document.getElementById('ps-user') as HTMLInputElement | null;
                  startPrivate(el?.value || '');
                }} disabled={busy}>Crea Private Show</Button>
              </div>
            ) : (
              <div className="flex gap-3 items-center">
                <div className="text-sm">Sessione attiva: {sessionId}</div>
                <Button variant="destructive" onClick={endPrivate} disabled={busy}>Termina</Button>
              </div>
            )}
            <div className="text-xs text-muted">Suggerimento: usa u-001 per i test rapidi.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Utenti recenti in chat</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-center">
            {recentUsers.length === 0 && <div className="text-sm text-muted">Nessuno ancora</div>}
            {recentUsers.map((u, i) => (
              <button
                key={i}
                className="px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 text-sm flex items-center gap-2"
                onClick={() => u.userId_B ? startPrivate(u.userId_B) : startPrivateByUsername(u.label)}
                title={u.userId_B ? `Avvia con ${u.label}` : `Avvia con ${u.label} (per username)`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path></svg>
                <span>{u.label}</span>
                {u.userId_B && <span className="text-xs text-muted">({u.userId_B})</span>}
              </button>
            ))}
            {recentUsers.length > 0 && (
              <button
                className="ml-auto px-3 py-1.5 rounded-full border border-border hover:bg-accent text-xs"
                onClick={() => {
                  const ts = Date.now();
                  setClearedAt(ts);
                  try { if (user) localStorage.setItem(`model:recentsClearedAt:${user.id}`, String(ts)); } catch {}
                  toast({ title: 'Recenti svuotati' });
                }}
              >
                Pulisci elenco
              </button>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
