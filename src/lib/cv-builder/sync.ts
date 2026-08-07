// Fire-and-forget backend sync of CV submissions. The builder itself stays
// offline/localStorage-first; this only mirrors the CV for admin review.
import type { CVData } from "./types";
import { saveCVSubmission } from "@/lib/cv-submissions.functions";

const TOKEN_KEY = "cvbuilder.v1.tokens";

function tokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Stable per-CV secret so a returning visitor updates their own row. */
export function editTokenFor(cvId: string): string {
  const all = tokens();
  const existing = all[cvId];
  if (existing) return existing;
  const fresh =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  all[cvId] = fresh;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(all));
  return fresh;
}

function completion(cv: CVData): number {
  const p = cv.personal;
  const filled = [
    p.full_name, p.father_name, p.mother_name, p.dob, p.mobile, p.email,
    p.present_address, p.permanent_address,
    cv.objective,
    cv.education.length > 0 ? "y" : "",
    cv.experience.length > 0 || cv.training.length > 0 ? "y" : "",
    cv.skills.computer || cv.skills.communication || cv.skills.languages ? "y" : "",
  ].filter(Boolean).length;
  return Math.round((filled / 12) * 100);
}

function jobTitle(cv: CVData): string {
  return cv.experience[0]?.position?.trim() || "";
}

let lastPayload = "";

export async function syncCVSubmission(cv: CVData, opts?: { force?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;
  const name = cv.personal.full_name.trim();
  const phone = cv.personal.mobile.trim();
  // Nothing identifiable yet — don't create noise rows.
  if (!name && !phone) return;

  const pct = completion(cv);
  const payload = {
    client_cv_id: cv.id,
    edit_token: editTokenFor(cv.id),
    cv_name: cv.name || "",
    full_name: name,
    phone,
    email: cv.personal.email.trim(),
    job_title: jobTitle(cv),
    template: cv.template,
    language: "English",
    status: (pct >= 75 ? "completed" : "draft") as "completed" | "draft",
    completion: pct,
    data: cv as unknown as Record<string, unknown>,
  };

  const signature = JSON.stringify(payload);
  if (!opts?.force && signature === lastPayload) return;
  lastPayload = signature;

  try {
    await saveCVSubmission({ data: payload });
  } catch (err) {
    // Never block the offline builder on a network failure.
    console.warn("CV sync failed", err);
  }
}
