const REF_KEY = "sendit_ref";
const REF_EXPIRES_KEY = "sendit_ref_expires";
const REF_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function saveRef(ref: string) {
  localStorage.setItem(REF_KEY, ref);
  localStorage.setItem(REF_EXPIRES_KEY, String(Date.now() + REF_DURATION_MS));
}

export function getRef(): string | null {
  if (typeof window === "undefined") return null;
  const ref = localStorage.getItem(REF_KEY);
  const expires = localStorage.getItem(REF_EXPIRES_KEY);
  if (!ref || !expires) return null;
  if (Date.now() > parseInt(expires)) {
    // Expired — clean up
    localStorage.removeItem(REF_KEY);
    localStorage.removeItem(REF_EXPIRES_KEY);
    return null;
  }
  return ref;
}

export function clearRef() {
  localStorage.removeItem(REF_KEY);
  localStorage.removeItem(REF_EXPIRES_KEY);
}
