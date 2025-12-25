import { buildImageUrl } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

// List of representative remote images we expect to render via proxy
const samples: Array<{ label: string; raw: string }> = [
  { label: 'Unsplash Portrait', raw: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=60' },
  { label: 'Unsplash Landscape', raw: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=60' },
  { label: 'Unsplash Closeup', raw: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60' }
];

interface ImgState { url: string; status: 'pending'|'ok'|'error'; bytes?: number; contentType?: string; }

export default function DebugImagesPage() {
  const [states, setStates] = useState<ImgState[]>(() => samples.map(s => ({ url: s.raw, status: 'pending' })));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: ImgState[] = [];
      for (const s of samples) {
        try {
          const proxied = `/api/proxy/img?u=${encodeURIComponent(s.raw)}`;
          const r = await fetch(proxied, { cache: 'no-store' });
          if (!r.ok) {
            next.push({ url: s.raw, status: 'error' });
            continue;
          }
          const buf = await r.arrayBuffer();
          next.push({ url: s.raw, status: 'ok', bytes: buf.byteLength, contentType: r.headers.get('content-type') || undefined });
        } catch {
          next.push({ url: s.raw, status: 'error' });
        }
      }
      if (!cancelled) setStates(next);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Image Proxy Debug</h1>
        <p className="text-sm text-muted mb-4">This page fetches representative remote images through <code>/api/proxy/img</code> and reports status, content-type and size. Use it to diagnose CSP or proxy issues.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {samples.map((s, i) => {
            const st = states[i];
            const proxied = buildImageUrl(s.raw);
            return (
              <div key={s.raw} className="p-3 border border-border rounded-md bg-card space-y-2">
                <div className="font-semibold text-sm truncate" title={s.raw}>{s.label}</div>
                <picture>
                  <source srcSet={buildImageUrl(s.raw, { preferWebp: true })} type="image/webp" />
                  <img
                    src={proxied}
                    alt={s.label}
                    className="w-full aspect-[3/4] object-cover rounded"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e)=>{ const el=e.currentTarget; el.onerror=null; el.src='/logo.png'; }}
                  />
                </picture>
                <div className="text-xs">
                  Status: {st?.status === 'pending' && <span className="text-muted">pending…</span>}
                  {st?.status === 'ok' && <span className="text-online">OK</span>}
                  {st?.status === 'error' && <span className="text-destructive">ERROR</span>}
                </div>
                {st?.bytes && (
                  <div className="text-[11px] text-muted">{st.bytes} bytes · {st.contentType}</div>
                )}
                <div className="text-[10px] break-all max-h-20 overflow-y-auto text-muted-foreground">{s.raw}</div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
