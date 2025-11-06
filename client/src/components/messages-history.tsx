import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MessagesHistoryButton() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["public-chat-history", open],
    queryFn: async () => {
      const r = await fetch(`/api/chat/public?limit=200`);
      if (!r.ok) return [] as Array<{ user: string; text: string; when?: string }>;
      return r.json();
    },
    enabled: open,
    refetchInterval: open ? 10000 : false,
  });

  const items = Array.isArray(data) ? data : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="px-3 py-2 rounded-lg hover:bg-accent relative"
          aria-label="Messages history"
          title="Messaggi pubblici"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold-primary mr-1 inline-block align-middle"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="hidden md:inline">Messaggi</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat Pubblica (cronologia)</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] overflow-auto border border-border rounded-md p-3 bg-card">
          {items.length === 0 && (
            <div className="text-sm text-muted">Nessun messaggio</div>
          )}
          <ul className="space-y-2">
            {items.map((m: any, i: number) => (
              <li key={i} className="text-sm">
                <span className="text-gold-primary font-medium">{String(m.user)}:</span>{" "}
                <span>{String(m.text)}</span>
                {m.when && (
                  <span className="text-xs text-muted ml-2">{new Date(m.when).toLocaleString()}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
