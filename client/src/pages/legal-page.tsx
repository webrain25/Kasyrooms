import Header from "@/components/header";
import Footer from "@/components/footer";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

type LegalSlug = 'privacy' | 'terms' | 'cookies' | '18plus' | '2257';

export default function LegalPage({ slug, titleKey, title }: { slug: LegalSlug; titleKey: string; title?: string }) {
  const { lang, t } = useI18n();
  const [content, setContent] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert raw legal TXT into readable sections: headings, paragraphs, bulleted lists
  const formatTextToJSX = (txt: string) => {
    const lines = txt.replaceAll("\r\n", "\n").split("\n");
    const sections: string[][] = [];
    let group: string[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        if (group.length) { sections.push(group); group = []; }
        continue;
      }
      group.push(line);
    }
    if (group.length) sections.push(group);

    const nodes: React.ReactNode[] = [];
    sections.forEach((g, i) => {
      if (g.length === 1) {
        const l = g[0];
        // Short or ending with ':' => treat as heading
        if (l.endsWith(":") || l.length < 60) {
          nodes.push(<h3 key={`h-${i}`} className="mt-7 mb-3 text-gold-primary">{l.replace(/:$/,'')}</h3>);
        } else {
          nodes.push(<p key={`p-${i}`} className="my-4">{l}</p>);
        }
      } else {
        // Mixed content: Only lines that start with numeric prefixes become list items.
        // Other lines remain plain text paragraphs. Preserve original order.
        const bulletPrefixRe = /^[-–—•*]\s*/;
        const numericAnyRe = /^\(?\d+(?:\.\d+)*[.)]?/; // matches 1, 1), 1., 1.1, (1)

        const listBuffer: React.ReactNode[] = [];
        const out: React.ReactNode[] = [];
        let paraBuffer: string[] = [];

        const flushList = () => {
          if (listBuffer.length) {
            out.push(
              <div key={`n-${i}-${out.length}`} className="space-y-5">
                {listBuffer.splice(0, listBuffer.length)}
              </div>
            );
          }
        };
        const flushPara = () => {
          if (paraBuffer.length) {
            out.push(
              <p key={`p-${i}-${out.length}`} className="my-4">{paraBuffer.join(' ')}</p>
            );
            paraBuffer = [];
          }
        };

        g.forEach((raw, j) => {
          const li = raw.trim();
          const noBullet = li.replace(bulletPrefixRe, "").trim();
          const m = noBullet.match(numericAnyRe);
          if (m) {
            // Flush any accumulated paragraph before starting/continuing a list
            flushPara();
            const full = m[0];
            let label = full;
            // Remove surrounding parentheses if present, e.g., "(1)"
            label = label.replace(/^\((.*)\)$/,'$1');
            // Strip a single trailing '.' or ')' (but keep 1.1 intact)
            label = label.replace(/[.)]$/, '');
            // Normalize to '1.' or '1.1.' style
            label = `${label}.`;
            const text = noBullet.slice(full.length).trim();
            listBuffer.push(
              <div key={`li-${i}-${j}`} className="flex items-start gap-2">
                <span className="min-w-[3ch] text-gold-primary font-semibold select-none">{label}</span>
                <span className="flex-1">{text}</span>
              </div>
            );
          } else {
            // Not a numeric line: flush any ongoing list and accumulate as paragraph text
            flushList();
            paraBuffer.push(noBullet);
          }
        });

        // Flush remaining buffers
        flushList();
        flushPara();

        nodes.push(<div key={`sec-${i}`} className="space-y-5">{out}</div>);
      }
    });
    return nodes;
  };

  useEffect(() => {
    const primary = `${slug}-${lang}.txt`;
    const extra = slug === '18plus' ? `2257-${lang}.txt` : null;
    const load = async () => {
      try {
        const res1 = await fetch(`/legal/${primary}`);
        if (!res1.ok) throw new Error(`HTTP ${res1.status}`);
        const t1 = await res1.text();
        if (extra) {
          const res2 = await fetch(`/legal/${extra}`);
          if (res2.ok) {
            const t2 = await res2.text();
            const nodes = [
              <h2 key="h-18" className="mt-2 mb-3 text-gold-primary">18+</h2>,
              ...formatTextToJSX(t1),
              <hr key="hr-merge" className="my-6 border-border" />,
              <h2 key="h-2257" className="mt-2 mb-3 text-gold-primary">2257</h2>,
              ...formatTextToJSX(t2)
            ];
            setContent(<>{nodes}</>);
            setError(null);
            return;
          }
        }
        setContent(<>{formatTextToJSX(t1)}</>);
        setError(null);
      } catch (e) {
        setError(`Unable to load legal page: ${String(e)}`);
        setContent(null);
      }
    };
    load();
  }, [slug, lang]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">{title ?? t(titleKey)}</h1>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <article
              className="prose max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-hr:border-border"
            >
              {content}
            </article>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
