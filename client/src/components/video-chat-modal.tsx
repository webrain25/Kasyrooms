import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { useRTC } from "./rtc/useRTC";
import { RemoteGrid } from "./rtc/RemoteGrid";
import { LocalPreview } from "./rtc/LocalPreview";

interface VideoChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  isModelOnline: boolean;
  isModelBusy?: boolean;
  modelId: string | number;
  isBlocked?: boolean;
}

export default function VideoChatModal({ isOpen, onClose, modelName, isModelOnline, isModelBusy, modelId, isBlocked }: VideoChatModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'preview' | 'locked' | 'private'>('preview');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<Array<{ id: string; user: string; text: string; when: string }>>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [walletMode, setWalletMode] = useState<'local' | 'shared' | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const previewActive = phase === 'preview' && isConnected;
  const isLocked = phase === 'locked';
  const isPrivate = phase === 'private' && isConnected;
  const intervalRef = useRef<number | null>(null);
  const billingIntervalRef = useRef<number | null>(null);
  const RATE_PER_MIN = 5.99;
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const chargedTotalRef = useRef<number>(0);
  const lastChatSentAtRef = useRef<number>(0);
  const bannedRx = useRef<RegExp[]>([/(offensive|hate|slur)/i]);

  // RTC setup: start in public room; can switch to private session room
  const [roomId, setRoomId] = useState<string>(`model:${String(modelId)}`);
  const rtc = useRTC(roomId, 'user');

  // Start/stop preview lifecycle
  useEffect(() => {
    if (!isOpen) return;
    // Reset state on open
    setPhase('preview');
    setIsConnected(false);
    setIsConnecting(false);
    setSecondsLeft(60);
    setChat([]);
    setBalance(null);
    // Fetch balance if logged in
    if (user) {
      (async () => {
        try {
          let authHeaders: Record<string, string> = {};
          try {
            const token = localStorage.getItem('token');
            if (token) authHeaders['Authorization'] = `Bearer ${token}`;
          } catch {}
          const resp = await fetch('/api/me', { credentials: 'include', headers: authHeaders });
          if (!resp.ok) return;
          const data = await resp.json();
          const w = data?.wallet;
          if (w && typeof w.balanceCents === 'number') setBalance(w.balanceCents / 100);
          if (w?.mode === 'local' || w?.mode === 'shared') setWalletMode(w.mode);
        } catch {}
      })();
    }
    // Auto-connect preview only if model online and not busy
    if (isModelOnline && !isModelBusy) {
      setIsConnecting(true);
      try { rtc.join(); } catch {}
      // consider connected for UI purposes; remote stream may arrive later
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
      }, 500);
    }
  }, [isOpen, isModelOnline, isModelBusy, user?.id]);

  // Preview timer
  useEffect(() => {
    if (!isOpen) return;
    if (phase !== 'preview' || !isConnected) return;
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          intervalRef.current && clearInterval(intervalRef.current);
          setPhase('locked');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, isConnected, isOpen]);

  const handleEnterPrivate = async () => {
    if (isBlocked) {
      toast({ title: 'Bloccato', description: 'Sei stato bloccato da questa modella.', variant: 'destructive' });
      return;
    }
    if (!isAuthenticated) {
      toast({ title: 'Accedi richiesto', description: 'Devi accedere per iniziare una privata.', variant: 'destructive' });
      return;
    }
    // Require at least 6 credits for first minute
    if (balance !== null && balance < 6) {
      toast({ title: 'Credito insufficiente', description: 'Ricarica crediti per iniziare una privata.', variant: 'destructive' });
      return;
    }
    if (!isModelOnline) {
      toast({ title: 'Modella offline', variant: 'destructive' });
      return;
    }
    if (isModelBusy) {
      toast({ title: 'Modella occupata', variant: 'destructive' });
      return;
    }
    setIsConnecting(true);
    setTimeout(async () => {
      setIsConnecting(false);
      setIsConnected(true);
      setPhase('private');
      try {
        await fetch(`/api/models/${String(modelId)}/busy`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBusy: true })
        });
        // start operator session
        if (user) {
          const resp = await fetch('/api/sessions/start', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId_B: user.id, modelId }) });
          if (resp.ok) {
            const data = await resp.json();
            if (data?.id) sessionIdRef.current = data.id as string;
            if (data?.id) {
              const sRoom = `session:${data.id}`;
              setRoomId(sRoom);
              try { rtc.switchRoom(sRoom); } catch {}
            }
          }
          sessionStartRef.current = Date.now();
          chargedTotalRef.current = 0;
        }
      } catch {}
    }, 800);
  };

  const deposit = async (amount: number) => {
    if (!user) {
      toast({ title: 'Accedi richiesto', description: 'Devi accedere per ricaricare.', variant: 'destructive' });
      return;
    }
    setWalletBusy(true);
    try {
      // Try local first
      let resp = await fetch('/api/wallet/deposit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, amount, source: 'ui' }) });
      if (!resp.ok) {
        resp = await fetch('/api/wallet/deposit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId_A: user.id, amount, source: 'ui' }) });
      }
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data.newBalance === 'number') setBalance(data.newBalance);
        if (data.mode === 'local' || data.mode === 'shared') setWalletMode(data.mode);
      }
    } finally { setWalletBusy(false); }
  };

  const withdraw = async (amount: number) => {
    if (!user) {
      toast({ title: 'Accedi richiesto', description: 'Devi accedere per effettuare pagamenti.', variant: 'destructive' });
      return false;
    }
    try {
      // Try local first
      let resp = await fetch('/api/wallet/withdrawal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, amount, source: 'private_show' }) });
      if (!resp.ok) {
        // Try shared
        resp = await fetch('/api/wallet/withdrawal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId_A: user.id, amount, source: 'private_show' }) });
      }
      if (!resp.ok) {
        try {
          const err = await resp.json();
          if (err?.error === 'INSUFFICIENT_FUNDS') {
            toast({ title: 'Saldo insufficiente', description: 'La chiamata privata verrà terminata.', variant: 'destructive' });
            handleEndCall();
            return false;
          }
        } catch {}
        return false;
      }
      const data = await resp.json();
      if (typeof data.newBalance === 'number') {
        setBalance(data.newBalance);
        // In shared mode the backend may allow negative balances; end call if below zero
        if (data.newBalance < 0) {
          toast({ title: 'Credito esaurito', description: 'La chiamata privata è stata terminata.', variant: 'destructive' });
          handleEndCall();
          return false;
        }
      }
      // count this minute as charged
      chargedTotalRef.current = (chargedTotalRef.current || 0) + amount;
      if (data.mode === 'local' || data.mode === 'shared') setWalletMode(data.mode);
      return true;
    } catch {
      return false;
    }
  };

  const handleEndCall = () => {
    setIsConnected(false);
    setPhase('preview');
    // stop billing interval
    if (billingIntervalRef.current) {
      clearInterval(billingIntervalRef.current);
      billingIntervalRef.current = null;
    }
    // end operator session if started
    const sid = sessionIdRef.current;
    const started = sessionStartRef.current;
    if (sid && started) {
      const durationSec = Math.max(1, Math.floor((Date.now() - started) / 1000));
      const totalCharged = Number(chargedTotalRef.current.toFixed(2));
      fetch(`/api/sessions/${sid}/end`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ durationSec, totalCharged }) }).catch(()=>{});
    }
    sessionIdRef.current = null;
    sessionStartRef.current = null;
    chargedTotalRef.current = 0;
    // reset busy state on end
    try {
      fetch(`/api/models/${String(modelId)}/busy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBusy: false })
      });
    } catch {}
    // switch back to public room
    const pub = `model:${String(modelId)}`;
    setRoomId(pub);
    try { rtc.switchRoom(pub); } catch {}
    onClose();
  };

  const timeFmt = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  const sendChat = async () => {
    if (isBlocked) {
      toast({ title: 'Bloccato', description: 'Sei stato bloccato da questa modella.', variant: 'destructive' });
      return;
    }
    if (!chatInput.trim()) return;
    const message = chatInput.trim();
    // Client-side bad-words filter
    if (bannedRx.current.some(rx => rx.test(message))) {
      toast({ title: 'Messaggio non consentito', description: 'Contiene parole vietate.', variant: 'destructive' });
      return;
    }
    // Simple client-side rate limit: 1 message / 2s
    const now = Date.now();
    if (now - lastChatSentAtRef.current < 2000) {
      return;
    }
    lastChatSentAtRef.current = now;
    setChat(prev => [{ id: String(Date.now()), user: isPrivate ? 'You (private)' : 'You', text: message, when: new Date().toLocaleTimeString() }, ...prev]);
    setChatInput("");
    if (!isPrivate) {
      try { await fetch('/api/chat/public', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user: 'Guest', text: message, modelId: String(modelId) }) }); } catch {}
    }
  };

  // Poll public chat for this model while modal is open and NOT in private
  useEffect(() => {
    if (!isOpen) return;
    if (isPrivate) return; // in private we don't use public chat
    let stopped = false;

    const tick = async () => {
      try {
        const r = await fetch(`/api/chat/public?modelId=${encodeURIComponent(String(modelId))}&limit=200`);
        if (!r.ok) return;
        const j = await r.json();
        if (!stopped && Array.isArray(j)) {
          const mapped = j.map((m: any, idx: number) => ({
            id: String(m.when || Date.now()) + ":" + idx,
            user: String(m.user || "Unknown"),
            text: String(m.text || ""),
            when: m.when ? new Date(m.when).toLocaleTimeString() : new Date().toLocaleTimeString(),
          }));
          setChat(mapped.reverse());
        }
      } catch {}
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [isOpen, isPrivate, modelId]);

  // Start per-minute billing when in private
  useEffect(() => {
    if (!isOpen) return;
    if (!isPrivate || !user) {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
      return;
    }

    // charge immediately for the first minute
    withdraw(RATE_PER_MIN);
    // then every minute
    billingIntervalRef.current = window.setInterval(() => {
      withdraw(RATE_PER_MIN);
    }, 60_000);

    return () => {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
      // also finalize session if dialog is closed unexpectedly
      const sid = sessionIdRef.current;
      const started = sessionStartRef.current;
      if (sid && started) {
        const durationSec = Math.max(1, Math.floor((Date.now() - started) / 1000));
        const totalCharged = Number(chargedTotalRef.current.toFixed(2));
        fetch(`/api/sessions/${sid}/end`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ durationSec, totalCharged }) }).catch(()=>{});
        sessionIdRef.current = null;
        sessionStartRef.current = null;
        chargedTotalRef.current = 0;
      }
    };
  }, [isPrivate, user?.id, isOpen]);

  // IMPORTANT: keep hooks unconditional. Only decide to render after hooks.
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-video mr-2 text-gold-primary"></i>
            {previewActive && 'Live Preview'}{isLocked && 'Preview Ended'}{isPrivate && 'Private Show'} with {modelName}
          </DialogTitle>
          <DialogDescription>
            {isBlocked
              ? 'You are blocked by this model.'
              : (!isModelOnline
                ? 'Model is currently offline.'
                : (isModelBusy
                  ? 'Model is currently busy.'
                  : (previewActive
                    ? `You have ${timeFmt} left`
                    : (isLocked
                      ? 'Preview ended. Start a private show to continue.'
                      : 'Ready to start private show'))))}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg aspect-video flex items-center justify-center relative bg-black">
              {/* Prefer real remote streams when available during preview/private */}
              {(rtc.remoteStreams.size > 0) ? (
                <RemoteGrid streams={rtc.remoteStreams} />
              ) : (
                <div className="text-center text-white">
                  <i className="fas fa-video text-6xl mb-4 opacity-50"></i>
                  <p className="text-lg">
                    {(!isModelOnline) ? 'Offline'
                      : (isModelBusy ? 'Busy'
                        : (previewActive ? 'Live Preview' : isPrivate ? 'Private Show' : isLocked ? 'Preview Ended' : 'Waiting...'))}
                  </p>
                  <p className="text-sm opacity-75">
                    {(!isModelOnline) ? 'This model is offline. Private show is not available.'
                      : (isModelBusy ? 'This model is currently busy. Please try again later.'
                        : 'Waiting for live stream…')}
                  </p>
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                {isConnected && (
                  <>
                    <Button variant="destructive" onClick={handleEndCall} className="rounded-full w-12 h-12">
                      <i className="fas fa-phone-slash"></i>
                    </Button>
                    <Button variant="outline" className="rounded-full w-12 h-12 bg-white/20 border-white/20 text-white">
                      <i className="fas fa-microphone"></i>
                    </Button>
                    <Button variant="outline" className="rounded-full w-12 h-12 bg-white/20 border-white/20 text-white">
                      <i className="fas fa-video"></i>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Preview CTA / Paywall */}
            {previewActive && (
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Time left: <span className="font-semibold text-gold-primary">{timeFmt}</span> of free preview</span>
                <Button onClick={handleEnterPrivate} className="btn-gold text-background" disabled={!!isBlocked || !isModelOnline || !!isModelBusy}>
                  <i className="fas fa-lock-open mr-2"></i>
                  Go Private Now
                </Button>
              </div>
            )}
            {isLocked && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-semibold mb-1">Preview ended</p>
                  <p className="text-sm text-muted">Start a private show to continue watching. Rate: <span className="text-gold-primary font-semibold">5.99 credits/min</span></p>
                </div>
                <div className="space-x-2">
                  <Button onClick={handleEnterPrivate} disabled={!!isBlocked || !isModelOnline || !!isModelBusy || isConnecting} className="btn-gold text-background">
                    {isConnecting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Connecting...</>) : (<><i className="fas fa-video mr-2"></i>Start Private Show</>)}
                  </Button>
                  {!isAuthenticated && (
                    <Button variant="outline" onClick={() => window.location.href = '/login'}>
                      <i className="fas fa-sign-in-alt mr-2"></i>Sign In
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{isPrivate ? 'Private Chat' : 'Public Chat'}</span>
                  {previewActive && <span className="text-xs text-muted">Shared with everyone</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-64 overflow-auto flex flex-col-reverse gap-2">
                  {chat.map(m => (
                    <div key={m.id} className="text-sm">
                      <span className="text-muted mr-2">[{m.when}]</span>
                      <span className="font-semibold mr-2">{m.user}:</span>
                      <span>{m.text}</span>
                    </div>
                  ))}
                  {chat.length === 0 && <p className="text-sm text-muted">No messages yet</p>}
                </div>
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder={isBlocked ? "You are blocked" : "Type a message"} disabled={!!isBlocked} className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm disabled:opacity-50" />
                  <Button onClick={sendChat} variant="outline" disabled={!!isBlocked}>Send</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-sm text-muted flex items-center justify-between">
                <span>Rate: <span className="text-gold-primary font-semibold">{RATE_PER_MIN} credits/min</span></span>
                <div className="flex items-center gap-3">
                  <span>Status: {previewActive ? 'Preview' : isPrivate ? 'Private' : isLocked ? 'Ended' : 'Idle'}</span>
                  {user && (
                    <>
                      <span>| Balance: <span className="font-semibold">{balance !== null ? balance.toFixed(2) : '—'}</span>{walletMode ? ` (${walletMode})` : ''}</span>
                      <Button size="sm" variant="outline" onClick={() => deposit(20)} disabled={walletBusy}>+20</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}