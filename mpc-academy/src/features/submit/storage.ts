import { EMPTY_WIZARD, type WizardData } from "./schema";

/**
 * Draft persistence.
 * Saves the current step + answers so a refresh resumes exactly where the
 * member left off. The video File itself can't be serialised — only its
 * metadata — so a resumed draft shows the clip as already attached.
 */

const KEY = "mpc:submit-draft:v1";

export interface Draft {
  step: number;
  data: WizardData;
}

/** Read a saved draft. Returns null on the server or when nothing is stored. */
export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      step: typeof parsed.step === "number" ? parsed.step : 0,
      data: { ...EMPTY_WIZARD, ...(parsed.data ?? {}) },
    };
  } catch {
    return null;
  }
}

/** Persist the current draft. Silently no-ops if storage is unavailable. */
export function saveDraft(draft: Draft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage full or blocked — non-critical */
  }
}

/** Clear the draft (on successful submit or an explicit reset). */
export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
