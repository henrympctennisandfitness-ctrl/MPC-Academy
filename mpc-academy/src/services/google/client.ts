/**
 * Google Sheets backend — HTTP transport.
 * ---------------------------------------------------------------------------
 * Low-level talking to the Apps Script Web App. Nothing here knows about
 * submissions — it just sends a request and returns parsed JSON, turning every
 * failure mode (offline, non-2xx, unparseable body, `{ ok:false }`) into a
 * thrown Error with a human-readable message the UI can surface as a toast.
 *
 * Reads use GET with query params (a "simple" CORS request). Writes use POST
 * with a `text/plain` body — that also stays a simple request, so the Apps
 * Script runtime never has to answer a CORS preflight it cannot.
 */

import { GOOGLE_SHEETS_CONFIG } from "./config";

/** Shape every Apps Script endpoint responds with. */
interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 20_000;

/** Wrap fetch with a timeout so a dead endpoint fails fast, not forever. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The request timed out. Check your connection and retry.");
    }
    throw new Error("Network error — couldn't reach the server.");
  } finally {
    clearTimeout(timer);
  }
}

/** Parse the response and unwrap the `{ ok, data, error }` envelope. */
async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Server error (status ${res.status}). Please try again.`);
  }
  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("Unexpected response from the server.");
  }
  if (!body.ok) {
    throw new Error(body.error || "The request was rejected.");
  }
  return body.data as T;
}

/** GET `action` with query params. Used for reads. */
export async function getRequest<T>(
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(GOOGLE_SHEETS_CONFIG.appsScriptUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetchWithTimeout(url.toString(), { method: "GET" });
  return unwrap<T>(res);
}

/** POST a JSON body as text/plain. Used for writes. */
export async function postRequest<T>(body: unknown): Promise<T> {
  const res = await fetchWithTimeout(GOOGLE_SHEETS_CONFIG.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}
