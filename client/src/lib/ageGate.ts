const AGE_KEY = "kasyrooms_age_ok";

export function isAgeOK(): boolean {
  try {
    // Show the banner at every new site open: store consent only for the current tab/session
    const v = sessionStorage.getItem(AGE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export function acceptAge(): void {
  try {
    sessionStorage.setItem(AGE_KEY, "1");
    // No persistent cookie: consent resets on browser/tab close
  } catch {}
}

export function clearAgeConsent(): void {
  try {
    sessionStorage.removeItem(AGE_KEY);
  } catch {}
}
