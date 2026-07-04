# Google Apps Script — the MPC Academy backend (Phase 1: Sheets only)

This one Apps Script Web App **is** the backend. The Google Sheet is the
database; this script is the API in front of it. There is no custom server, and
**no Google Drive yet** — Phase 1 stores each submission's video *filename* plus
a placeholder so Drive can be wired in later (Phase 2) without touching the UI.

## 1. Create the Sheet

1. Create a new Google Sheet, e.g. **MPC Academy — Submissions**.
2. Copy its **ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
   You don't need to add headers — the script writes them on first run.

## 2. Create the script

1. Go to https://script.google.com → **New project**.
2. Delete the starter code, paste in `Code.gs` from this folder.
3. At the top, set:
   - `CONFIG.SHEET_ID` → the ID from step 1 (**required**)
   - `CONFIG.SHEET_NAME` → leave as `Submissions` unless you renamed the tab
   - `CONFIG.COACH_EMAIL` → where the "new submission" email goes (optional)
4. Save.

## 3. Deploy as a Web App

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone* ← required so the portal can call it
3. **Deploy**, then **Authorize access** and approve the Sheets (+ Gmail, if you
   set a coach email) scopes. You'll see a "Google hasn't verified this app"
   screen — it's your own script; continue.
4. Copy the **Web app URL** (ends in `/exec`).

Open that URL in a browser — you should see
`{"ok":true,"service":"MPC Academy submissions","status":"ready"}`.

## 4. Point the portal at it

In the Next.js project, create `.env.local`:

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-sheet-id          # optional (reference only)
NEXT_PUBLIC_GOOGLE_SHEET_NAME=Submissions          # optional, defaults to this
```

Restart `npm run dev`. The portal now reads and writes live Sheet data. **With
the URL unset, the app runs against a built-in in-memory mock** so development
works with zero Google setup.

## Re-deploying after edits

Editing `Code.gs` doesn't update the live URL automatically:
**Deploy → Manage deployments → Edit → Version: New version → Deploy.**

## The API

Every response is `{ ok: boolean, data?, error? }`.

| Method | Request | Purpose |
| --- | --- | --- |
| `GET`  | `?action=list` | All submissions (coach dashboard) |
| `GET`  | `?action=list&email=x@y.com` | One member's submissions (My Progress) |
| `POST` | `{ action:"create", submission }` | Append a new submission |
| `POST` | `{ action:"updateStatus", id, status }` | New / In Review / Completed |
| `POST` | `{ action:"updateFeedback", id, feedback, coachNotes? }` | Return feedback + complete |
| `POST` | `{ action:"updateProgressRating", id, rating }` | Set 0–100 rating |

Writes are sent as `text/plain` to avoid a CORS preflight the Apps Script
runtime can't answer; reads are simple GETs. Both work cross-origin from the
browser.

## Columns recorded per submission

| Column | Source |
| --- | --- |
| Submission ID | generated at submit time (unique) |
| Timestamp | submit time (ISO) |
| Member Name / Member Email / Membership ID | member session |
| Analysis Type / Goal / Notes | wizard answers |
| Status | defaults to `New` |
| Assigned Coach | set during triage |
| Coach Feedback / Coach Notes | coach actions |
| Completion Date | stamped when Status → Completed |
| Progress Rating | 0–100, set by coach |
| Video Filename | chosen clip's name (bytes **not** uploaded in Phase 1) |
| Video Placeholder | `PENDING_DRIVE_UPLOAD` until Phase 2 |

## Phase 2 hook — Google Drive

`createSubmission_()` in `Code.gs` marks exactly where the video upload lands:
decode/upload the file to Drive, store the resulting URL in the **Video
Placeholder** column (rename it "Video URL"), and have the portal send the file
bytes. No other part of the flow changes.
