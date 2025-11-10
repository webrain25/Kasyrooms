const AGE_KEY = "kasyrooms_age_ok";

export function isAgeOK(): boolean {
  try {
    const v = localStorage.getItem(AGE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export function acceptAge(): void {
  try {
    localStorage.setItem(AGE_KEY, "1");
    // best-effort cookie for server-rendered assets/CDN if needed
    document.cookie = `${AGE_KEY}=1; path=/; max-age=${60*60*24*365}; SameSite=Lax`;
  } catch {}
}

export function clearAgeConsent(): void {
  try {
    localStorage.removeItem(AGE_KEY);
    document.cookie = `${AGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}
