import { GOOGLE_CONFIG } from "@/lib/config";

/**
 * Submission API client.
 *
 * Sends the wizard's answers + the video to the Google Apps Script Web App.
 * The video is base64-encoded and posted as JSON with a `text/plain` content
 * type — that keeps it a "simple" CORS request, which the Apps Script runtime
 * can answer (it can't respond to a preflight OPTIONS).
 */

export interface SubmissionPayload {
  name: string;
  email: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes?: string;
  file: File;
}

export interface SubmissionResult {
  ok: boolean;
  videoUrl?: string;
  row?: number;
  message?: string;
  error?: string;
}

export interface UploadOptions {
  /** Called with 0–100 as the request body uploads. */
  onProgress?: (percent: number) => void;
  /** Abort the in-flight upload. */
  signal?: AbortSignal;
}

/**
 * Apps Script Web Apps cap the request body near ~50MB; base64 adds ~33%.
 * Keep the real file under this for the Apps Script path. Larger clips need a
 * resumable Drive upload (documented in apps-script/README.md).
 */
export const APPS_SCRIPT_MAX_BYTES = 40 * 1024 * 1024;

/** Read a File into a raw base64 string (strips the data: URL prefix). */
function readAsBase64(
  file: File,
): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the video file."));
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve({
        base64,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  });
}

/** Assemble the JSON body the Apps Script expects. */
function buildBody(
  payload: SubmissionPayload,
  encoded: { base64: string; mimeType: string; fileName: string },
): string {
  return JSON.stringify({
    name: payload.name,
    email: payload.email,
    membershipId: payload.membershipId,
    analysisType: payload.analysisType,
    goal: payload.goal,
    notes: payload.notes ?? "",
    fileName: encoded.fileName,
    mimeType: encoded.mimeType,
    fileData: encoded.base64,
  });
}

/**
 * Primary uploader. Uses XMLHttpRequest because `fetch()` cannot report upload
 * progress in browsers — and a long video upload needs a progress bar.
 */
export async function uploadSubmission(
  payload: SubmissionPayload,
  opts: UploadOptions = {},
): Promise<SubmissionResult> {
  const url = GOOGLE_CONFIG.appsScriptUrl;

  opts.onProgress?.(0);
  const encoded = await readAsBase64(payload.file);
  const body = buildBody(payload, encoded);

  // No endpoint configured → simulate a successful submit so the wizard is
  // fully usable in development.
  if (!url) return simulateUpload(opts);

  return new Promise<SubmissionResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
    xhr.timeout = 5 * 60 * 1000; // 5 min

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        opts.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      opts.onProgress?.(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as SubmissionResult;
          if (data.ok) resolve(data);
          else reject(new Error(data.error || "The submission was rejected."));
        } catch {
          reject(new Error("Unexpected response from the server."));
        }
      } else {
        reject(new Error(`Upload failed (status ${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("The upload timed out. Try again."));

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => xhr.abort());
      xhr.onabort = () =>
        reject(new DOMException("Upload cancelled", "AbortError"));
    }

    xhr.send(body);
  });
}

/**
 * Alternative uploader using `fetch()`. Simpler and fine when you don't need a
 * progress bar — browsers can't surface upload progress through fetch(), so
 * `onProgress` isn't available here. Kept for reference / server-to-server use.
 */
export async function uploadSubmissionViaFetch(
  payload: SubmissionPayload,
): Promise<SubmissionResult> {
  const url = GOOGLE_CONFIG.appsScriptUrl;
  if (!url) throw new Error("No Apps Script URL configured.");

  const encoded = await readAsBase64(payload.file);

  const res = await fetch(url, {
    method: "POST",
    // text/plain avoids a CORS preflight the Apps Script runtime can't answer.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: buildBody(payload, encoded),
  });

  if (!res.ok) throw new Error(`Upload failed (status ${res.status}).`);
  const data = (await res.json()) as SubmissionResult;
  if (!data.ok) throw new Error(data.error || "The submission was rejected.");
  return data;
}

/** Dev-only stand-in when no endpoint is configured. */
function simulateUpload(opts: UploadOptions): Promise<SubmissionResult> {
  return new Promise((resolve) => {
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 7 + Math.random() * 10);
      opts.onProgress?.(Math.round(p));
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(
          () =>
            resolve({
              ok: true,
              videoUrl: "",
              message: "Submitted (simulated — no endpoint configured).",
            }),
          300,
        );
      }
    }, 120);
  });
}
