import { FullAnalysis } from "./types";

const STORAGE_KEY = "sendit_analyses";
const PROMPT_VERSION_KEY = "sendit_prompt_version";

// Bump this when the prompt changes significantly — old results get marked stale
export const CURRENT_PROMPT_VERSION = 1;

interface StoredAnalysis {
  analysis: FullAnalysis;
  promptVersion: number;
  createdAt: string;
}

function getStore(): Record<string, StoredAnalysis> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, StoredAnalysis>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveAnalysis(analysis: FullAnalysis): string {
  const store = getStore();
  store[analysis.id] = {
    analysis,
    promptVersion: CURRENT_PROMPT_VERSION,
    createdAt: new Date().toISOString(),
  };
  setStore(store);
  return analysis.id;
}

export function getAnalysis(id: string): StoredAnalysis | null {
  const store = getStore();
  return store[id] || null;
}

export function getAllAnalyses(): StoredAnalysis[] {
  const store = getStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteAnalysis(id: string) {
  const store = getStore();
  delete store[id];
  setStore(store);
}

export function clearAllAnalyses() {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearStaleAnalyses() {
  const store = getStore();
  const cleaned: Record<string, StoredAnalysis> = {};
  for (const [id, entry] of Object.entries(store)) {
    if (entry.promptVersion === CURRENT_PROMPT_VERSION) {
      cleaned[id] = entry;
    }
  }
  setStore(cleaned);
  return Object.keys(store).length - Object.keys(cleaned).length;
}

// Check if a URL has already been analyzed (returns the analysis ID if found)
export function findByUrl(url: string): string | null {
  const store = getStore();
  for (const [id, entry] of Object.entries(store)) {
    if (
      entry.analysis.listing.url === url &&
      entry.promptVersion === CURRENT_PROMPT_VERSION
    ) {
      return id;
    }
  }
  return null;
}
