import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VideoChatModal from "@/components/video-chat-modal";
import { Model } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/lib/favoritesContext";
import { useAuth } from "@/lib/authContext";
import { buildImageUrl } from "@/lib/utils";

export default function ModelProfile() {
  const [, params] = useRoute("/model/:id");
  const modelId = params?.id;
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [tipping, setTipping] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const { data: model, isLoading, error } = useQuery<Model>({
    queryKey: [`/api/models/${modelId}`],
    enabled: !!modelId,
  });

  useEffect(() => {
    const loadBlock = async () => {
      if (!modelId || !user) return;
      const r = await fetch(`/api/moderation/blocks?modelId=${modelId}`);
      const j = await r.json();
      const blocked = Array.isArray(j.blocks) && j.blocks.includes(user.id);
      setIsBlocked(!!blocked);
    };
    loadBlock();
  }, [modelId, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-[3/4] bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <i className="fas fa-user-slash text-muted text-6xl mb-4"></i>
            <h1 className="text-2xl font-bold mb-2">Model Not Found</h1>
            <p className="text-muted mb-4">The model you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const handleStartPrivateShow = () => {
    if (isBlocked) return alert('You are blocked by this model.');
    if (!model.isOnline) return alert('This model is offline.');
    if (model.isBusy) return alert('This model is currently busy.');
    setIsVideoChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (isBlocked) return alert('You are blocked by this model.');
    if (!isAuthenticated) return (window.location.href = '/login');
    const text = chatMessage.trim();
    if (!text) return alert('Please type a message');
    setChatSending(true);
    try {
      const displayName = user?.username || 'user';
      const body = { user: displayName, text, userId_B: user?.id, modelId };
      const r = await fetch('/api/chat/public', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        return alert(j?.error ? `Message failed: ${j.error}` : 'Message failed');
      }
      setChatMessage("");
      alert('Message sent');
    } finally { setChatSending(false); }
  };

  const handleReport = async () => {
    if (!isAuthenticated) return (window.location.href = '/login');
    if (!reportReason.trim()) return alert('Please enter a reason');
    setReporting(true);
    try {
      await fetch('/api/moderation/report', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ modelId, userId: user?.id, reason: reportReason }) });
      alert('Report sent');
      setReportReason("");
    } finally {
      setReporting(false);
    }
  };
  const handleTip = async () => {
    if (!isAuthenticated) return (window.location.href = '/login');
    const amount = Number(tipAmount);
    if (!Number.isFinite(amount) || amount <= 0) return alert('Enter a valid amount');
    setTipping(true);
    try {
      const r = await fetch(`/api/models/${modelId}/tip`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount }) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        if (j?.error === 'INSUFFICIENT_FUNDS') return alert('Insufficient funds');
        return alert('Tip failed');
      }
  alert('Thanks for tipping!');
  // Notify wallet listeners to refresh balance
  try { window.dispatchEvent(new CustomEvent('wallet:changed')); } catch {}
      setTipAmount('');
    } finally { setTipping(false); }
  }
  const handleBlock = async () => {
    if (!isAuthenticated) return (window.location.href = '/login');
    if (!modelId) return;
    setBlockBusy(true);
    try {
      await fetch('/api/moderation/block', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ modelId, userId: user?.id }) });
      setIsBlocked(true);
      alert('Blocked');
    } finally { setBlockBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Model Image */}
          <div className="relative">
            <picture>
              {model.profileImage && (
                <source srcSet={buildImageUrl(model.profileImage, { preferWebp: true })} type="image/webp" />
              )}
              <img
                src={buildImageUrl(model.profileImage)}
                alt={`${model.name}'s profile`}
                className="w-full aspect-[3/4] object-cover rounded-lg"
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e)=>{ const el=e.currentTarget; el.onerror=null; el.src='/logo.png'; }}
              />
            </picture>
            
            {/* Status and Badges Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant={model.isOnline ? "default" : "secondary"} className={model.isOnline ? "bg-online" : ""}>
                <i className="fas fa-circle mr-1 text-xs"></i>
                {model.isOnline ? "Online" : "Offline"}
              </Badge>
              {/* VIP removed */}
            </div>

            {/* New Badge - Top Right */}
            {model.isNew && (
              <div className="absolute top-4 right-4">
                <Badge variant="destructive">
                  NEW
                </Badge>
              </div>
            )}

            {/* Rating Badge - Bottom Right */}
            <div className="absolute bottom-4 right-4">
              <Badge variant="outline" className="bg-background/90">
                <i className="fas fa-star text-gold-primary mr-1"></i>
                {model.rating ? formatRating(model.rating) : 'New'}
              </Badge>
            </div>
          </div>

          {/* Model Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold flex items-center">{model.name}</h1>
                <button
                  onClick={() => toggleFavorite(model.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${isFavorite(model.id) ? 'bg-gold-primary text-background border-gold-primary' : 'bg-card text-foreground border-border'}`}
                  aria-label="Toggle favorite"
                >
                  <i className="fas fa-heart"></i>
                </button>
              </div>
              <div className="flex items-center space-x-4 text-muted">
                <span><i className="fas fa-user mr-1"></i>{model.age} years old</span>
                <span><i className="fas fa-map-marker-alt mr-1"></i>{model.country}</span>
                <span><i className="fas fa-eye mr-1"></i>{model.viewerCount} watching</span>
              </div>
            </div>

            {/* Languages */}
            <div>
              <h3 className="font-semibold mb-2">Languages</h3>
              <div className="flex gap-2">
                {model.languages.map(language => (
                  <Badge key={language} variant="outline">{language}</Badge>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h3 className="font-semibold mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {model.specialties.map(specialty => (
                  <Badge key={specialty} variant="secondary">{specialty}</Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleStartPrivateShow}
                className="w-full btn-gold text-background disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                disabled={!model.isOnline || !!model.isBusy || isBlocked}
                title={!model.isOnline ? 'Offline' : (model.isBusy ? 'Busy' : (isBlocked ? 'Blocked' : ''))}
              >
                <i className="fas fa-video mr-2"></i>
                {(!model.isOnline) ? "Unavailable" : (model.isBusy ? "Busy" : "Start Private Show")}
              </Button>
              
              {/* Chat UI */}
              <div className="p-3 border border-border rounded-lg space-y-2">
                <div className="text-sm font-semibold">Send a Message</div>
                <div className="flex gap-2">
                  <Input value={chatMessage} onChange={e=>setChatMessage(e.target.value)} placeholder="Type your message" />
                  <Button onClick={handleSendMessage} disabled={chatSending || isBlocked} variant="outline">{chatSending ? 'Sending…' : 'Send'}</Button>
                </div>
                {isBlocked && (<div className="text-xs text-destructive">You are blocked by this model.</div>)}
              </div>

              {/* Tip UI */}
              <div className="p-3 border border-border rounded-lg space-y-2">
                <div className="text-sm font-semibold">Send a Tip</div>
                <div className="flex gap-2">
                  <Input type="number" step="0.5" min="1" value={tipAmount} onChange={e=>setTipAmount(e.target.value)} placeholder="Amount (EUR)" />
                  <Button onClick={handleTip} disabled={tipping}>{tipping ? 'Sending…' : 'Tip'}</Button>
                </div>
                <div className="text-xs text-muted">Tips are charged from your wallet balance.</div>
              </div>

              {/* Moderation: report / block */}
              <div className="p-3 border border-border rounded-lg space-y-2">
                <div className="text-sm font-semibold">Moderation</div>
                <div className="flex gap-2">
                  <input value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Reason to report" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-sm" />
                  <Button onClick={handleReport} disabled={reporting} variant="outline">
                    {reporting ? 'Reporting…' : 'Report'}
                  </Button>
                </div>
                <Button onClick={handleBlock} disabled={blockBusy || isBlocked} variant="destructive" className="w-full">
                  {isBlocked ? 'Blocked' : (blockBusy ? 'Blocking…' : 'Block')}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    <i className="fas fa-star text-gold-primary mr-1"></i>
                    {model.rating ? formatRating(model.rating) : 'New'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Viewers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    <i className="fas fa-eye text-muted mr-1"></i>
                    {model.viewerCount}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <VideoChatModal
        isOpen={isVideoChatOpen}
        onClose={() => setIsVideoChatOpen(false)}
        modelName={model.name}
        isModelOnline={model.isOnline || false}
        isModelBusy={!!model.isBusy}
        modelId={model.id}
        isBlocked={isBlocked}
      />
    </div>
  );
}