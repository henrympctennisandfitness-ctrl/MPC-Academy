/**
 * Google Drive — direct, resumable video upload (browser → Drive).
 * ===========================================================================
 * Large videos (up to 3GB) are uploaded straight from the browser to Google
 * Drive using Drive's resumable upload API — they NEVER pass through Apps
 * Script. Apps Script only ever records the resulting Drive URL as metadata.
 *
 * Authorization (NOT app login): we obtain a short-lived Drive access token via
 * Google Identity Services (GIS) with the narrow `drive.file` scope — the app
 * can only see/manage files it creates. This is not a member sign-in / session
 * system; the mock user/role model is unchanged. The member consents once, then
 * the clip uploads to their own Drive and is shared so coaches can view it.
 *
 * Resilience:
 *  • The file uploads in 8MB chunks with real progress.
 *  • Failed chunks are retried after re-syncing the byte offset with Drive.
 *  • The resumable session URI is persisted (sessionStorage), so an interrupted
 *    upload of the same file can resume where it left off — even after a reload
 *    (Drive keeps a session alive ~1 week).
 */

import { GOOGLE_DRIVE_CONFIG } from "./config";
import type { DriveUploadResult } from "./types";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB — must be a multiple of 256KB
const MAX_CHUNK_RETRIES = 5;

export interface DriveUploadOptions {
  /** Drive filename, e.g. "MPC-XXXX - Serve - clip.mp4". */
  name: string;
  /** 0–100 upload progress. */
  onProgress?: (percent: number) => void;
  /** Abort the in-flight upload. */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Google Identity Services (token acquisition)
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Load the GIS client script once. */
function loadGis(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Drive upload runs in the browser only."));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("Couldn't load Google authorization. Check your connection."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

/** Get a Drive access token, prompting the member for consent when needed. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  await loadGis();
  const clientId = GOOGLE_DRIVE_CONFIG.oauthClientId;
  if (!clientId) throw new Error("Drive uploads aren't configured.");

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description ||
                "Google authorization was cancelled — can't upload the video.",
            ),
          );
          return;
        }
        // GIS tokens last ~1h; refresh a little early.
        cachedToken = {
          value: resp.access_token,
          expiresAt: Date.now() + 55 * 60_000,
        };
        resolve(resp.access_token);
      },
      error_callback: (err) =>
        reject(new Error(err.message || "Google authorization failed.")),
    });
    client.requestAccessToken();
  });
}

// ---------------------------------------------------------------------------
// Drive REST helpers
// ---------------------------------------------------------------------------

let folderIdCache: string | null = null;

/** Find (or create) the submissions folder in the member's Drive. */
async function ensureFolder(token: string): Promise<string> {
  if (folderIdCache) return folderIdCache;
  const name = GOOGLE_DRIVE_CONFIG.rootFolderName;

  // `drive.file` scope only lists files THIS app created — so this finds our
  // own folder if it exists, and never touches the member's other files.
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='${FOLDER_MIME}' and trashed=false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q,
  )}&fields=files(id)&spaces=drive`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const data = (await listRes.json()) as { files?: Array<{ id: string }> };
    if (data.files && data.files.length > 0) {
      folderIdCache = data.files[0].id;
      return folderIdCache;
    }
  }

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME }),
    },
  );
  if (!createRes.ok) throw new Error("Couldn't create the Drive folder.");
  const created = (await createRes.json()) as { id: string };
  folderIdCache = created.id;
  return folderIdCache;
}

/** Start a resumable session; returns the session URI (from the Location header). */
async function startSession(
  token: string,
  file: File,
  name: string,
  folderId: string,
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify({ name, parents: [folderId] }),
    },
  );
  if (!res.ok) throw new Error("Couldn't start the Drive upload.");
  const location = res.headers.get("location");
  if (!location) throw new Error("Drive didn't return an upload session.");
  return location;
}

interface OffsetStatus {
  done: boolean;
  fileId?: string;
  offset: number;
}

/** Ask Drive how many bytes it already has for a session (used to resume). */
async function queryOffset(sessionUri: string, total: number): Promise<OffsetStatus> {
  const res = await fetch(sessionUri, {
    method: "PUT",
    headers: { "Content-Range": `bytes */${total}` },
  });
  if (res.status === 200 || res.status === 201) {
    const body = (await res.json()) as { id: string };
    return { done: true, fileId: body.id, offset: total };
  }
  if (res.status === 308) {
    const range = res.headers.get("Range");
    const offset = range ? parseInt(range.split("-")[1], 10) + 1 : 0;
    return { done: false, offset };
  }
  throw new Error("Couldn't resume the Drive upload session.");
}

interface ChunkResult {
  done: boolean;
  fileId?: string;
  nextOffset?: number;
}

/** PUT one chunk with progress + abort support. */
function putChunk(
  sessionUri: string,
  file: File,
  start: number,
  onProgress: DriveUploadOptions["onProgress"],
  signal?: AbortSignal,
): Promise<ChunkResult> {
  return new Promise((resolve, reject) => {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUri, true);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const uploaded = start + e.loaded;
        onProgress(Math.min(99, Math.round((uploaded / file.size) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const body = JSON.parse(xhr.responseText) as { id: string };
          resolve({ done: true, fileId: body.id });
        } catch {
          reject(new Error("Unexpected response from Drive."));
        }
      } else if (xhr.status === 308) {
        const range = xhr.getResponseHeader("Range");
        const next = range ? parseInt(range.split("-")[1], 10) + 1 : end;
        resolve({ done: false, nextOffset: next });
      } else {
        reject(new Error(`Drive upload failed (status ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("The upload timed out."));

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Upload cancelled", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort());
      xhr.onabort = () =>
        reject(new DOMException("Upload cancelled", "AbortError"));
    }
    xhr.send(file.slice(start, end));
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upload every chunk, retrying + re-syncing the offset on transient failures. */
async function uploadChunks(
  sessionUri: string,
  file: File,
  startOffset: number,
  onProgress: DriveUploadOptions["onProgress"],
  signal?: AbortSignal,
): Promise<string> {
  let offset = startOffset;
  let attempts = 0;

  while (offset < file.size) {
    if (signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
    try {
      const res = await putChunk(sessionUri, file, offset, onProgress, signal);
      attempts = 0;
      if (res.done && res.fileId) return res.fileId;
      offset = res.nextOffset ?? offset;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      attempts += 1;
      if (attempts > MAX_CHUNK_RETRIES) {
        throw err instanceof Error ? err : new Error("The upload failed. Try again.");
      }
      await sleep(Math.min(1000 * 2 ** attempts, 15_000)); // capped backoff
      const status = await queryOffset(sessionUri, file.size);
      if (status.done && status.fileId) return status.fileId;
      offset = status.offset;
    }
  }

  // Loop ended without a completion body — confirm with a final status query.
  const final = await queryOffset(sessionUri, file.size);
  if (final.done && final.fileId) return final.fileId;
  throw new Error("The upload didn't finish. Please try again.");
}

// ---------------------------------------------------------------------------
// Session persistence (resume across reloads for the same file)
// ---------------------------------------------------------------------------

function sessionKey(file: File): string {
  return `mpc:drive-session:${file.name}:${file.size}:${file.lastModified}`;
}
function readSession(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeSession(key: string, uri: string): void {
  try {
    window.sessionStorage.setItem(key, uri);
  } catch {
    /* storage blocked — resume-across-reload simply won't be available */
  }
}
function clearSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload a video file directly to Google Drive (resumable, with progress) and
 * share it so coaches can view it. Returns the Drive file ID and a shareable URL.
 * Resumes a prior interrupted session for the same file when possible.
 */
export async function uploadVideoToDrive(
  file: File,
  opts: DriveUploadOptions,
): Promise<DriveUploadResult> {
  if (typeof window === "undefined") {
    throw new Error("Drive upload runs in the browser only.");
  }

  opts.onProgress?.(0);
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);

  const key = sessionKey(file);
  let sessionUri = readSession(key);
  let startOffset = 0;
  let fileId: string | undefined;

  if (sessionUri) {
    // Try to resume a previous session for this exact file.
    try {
      const status = await queryOffset(sessionUri, file.size);
      if (status.done) fileId = status.fileId;
      else startOffset = status.offset;
    } catch {
      sessionUri = null; // expired/invalid — start fresh below
      clearSession(key);
    }
  }

  if (!fileId) {
    if (!sessionUri) {
      sessionUri = await startSession(token, file, opts.name, folderId);
      writeSession(key, sessionUri);
    }
    fileId = await uploadChunks(sessionUri, file, startOffset, opts.onProgress, opts.signal);
  }

  clearSession(key);
  await shareFile(token, fileId);
  opts.onProgress?.(100);

  return { fileId, videoUrl: `https://drive.google.com/file/d/${fileId}/view` };
}

/**
 * Share the file so coaches can view it, per GOOGLE_DRIVE_CONFIG.sharing.
 * Best-effort: org policy may block link sharing, in which case the upload still
 * succeeds and the coach UI falls back to an "Open in Drive" button.
 */
async function shareFile(token: string, fileId: string): Promise<void> {
  if (GOOGLE_DRIVE_CONFIG.sharing !== "ANYONE_WITH_LINK") return;
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
  } catch {
    /* non-fatal — see doc comment */
  }
}
