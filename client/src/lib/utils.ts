import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildImageUrl(raw: string, opts?: { preferWebp?: boolean }): string {
  if (!raw) return raw;
  const preferWebp = !!opts?.preferWebp;
  // Do not re-proxy if already proxied
  if (raw.includes('/api/proxy/img')) return raw;
  // Local assets: keep as-is
  if (raw.startsWith('/uploads/') || raw.startsWith('/attached_assets/')) return raw;
  if (raw.startsWith('/')) return raw;
  // External http(s): proxy
  if (/^https?:\/\//i.test(raw)) {
    const p = preferWebp ? `/api/proxy/img?fmt=webp&u=${encodeURIComponent(raw)}` : `/api/proxy/img?u=${encodeURIComponent(raw)}`;
    return p;
  }
  return raw;
}
