import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.resolve(process.cwd(), 'uploads', 'cached');

export async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function hashUrl(u: string) {
  return crypto.createHash('sha256').update(u).digest('hex').slice(0, 32);
}

export async function getCachedImage(url: string): Promise<{ path: string; exists: boolean }> {
  const h = hashUrl(url);
  const filePath = path.join(CACHE_DIR, h + '.img');
  try {
    await fs.access(filePath);
    return { path: filePath, exists: true };
  } catch {
    return { path: filePath, exists: false };
  }
}

export async function downloadAndCache(url: string): Promise<string | null> {
  const { path: filePath, exists } = await getCachedImage(url);
  if (exists) return filePath;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Lightweight format sniff: check first bytes for JPEG/PNG/WebP
    await fs.writeFile(filePath, buf);
    return filePath;
  } catch {
    return null;
  }
}
