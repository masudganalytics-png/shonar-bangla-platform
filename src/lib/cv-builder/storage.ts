// localStorage-backed CV store. No backend, works offline.
import type { CVData } from "./types";
import { emptyCV } from "./types";

const LIST_KEY = "cvbuilder.v1.list";
const ACTIVE_KEY = "cvbuilder.v1.active";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function listCVs(): CVData[] {
  if (typeof window === "undefined") return [];
  return safeParse<CVData[]>(localStorage.getItem(LIST_KEY), []);
}

export function saveAll(cvs: CVData[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIST_KEY, JSON.stringify(cvs));
}

export function upsertCV(cv: CVData) {
  const all = listCVs();
  const next = { ...cv, updated_at: Date.now() };
  const idx = all.findIndex((c) => c.id === cv.id);
  if (idx === -1) all.unshift(next); else all[idx] = next;
  saveAll(all);
}

export function deleteCV(id: string) {
  saveAll(listCVs().filter((c) => c.id !== id));
  if (getActiveId() === id) setActiveId(null);
}

export function duplicateCV(id: string): CVData | null {
  const src = listCVs().find((c) => c.id === id);
  if (!src) return null;
  const copy: CVData = {
    ...JSON.parse(JSON.stringify(src)),
    id: Math.random().toString(36).slice(2, 10),
    name: src.name + " (Copy)",
    updated_at: Date.now(),
  };
  upsertCV(copy);
  return copy;
}

export function getActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function loadActiveOrCreate(): CVData {
  const id = getActiveId();
  const all = listCVs();
  const found = id ? all.find((c) => c.id === id) : null;
  if (found) return found;
  const fresh = emptyCV();
  upsertCV(fresh);
  setActiveId(fresh.id);
  return fresh;
}
