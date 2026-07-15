# Google Apps Script — the MPC Academy metadata backend

This Apps Script Web App is the **metadata** backend: the Google Sheet is the
database, and this script is the API in front of it (submissions, coach
feedback, status, progress ratings). There is no custom server.

**Videos never pass through this script.** The portal uploads each video
**directly to Google Drive from the browser** (resumable upload, up to 3GB) and
then sends this script only the resulting **Drive URL + filename**, which are
stored in the Sheet. See the app's `src/services/google/drive.ts` and the
project README for the Google Cloud **OAuth setup** the browser upload needs.

## 1. Create the Sheet

1. Create a new Google Sheet, e.g. **MPC Academy — Submissions**.
2. Copy its **ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
   Headers are written automatically on first run.

## 2. Create the script

1. Go to https://script.google.com → **New project**.
2. Delete the starter code, paste in `Code.gs` from this folder.
3. At the top (`CONFIG`), set:
   - `CONFIG.SHEET_ID` → the ID from step 1 (**required**)
   - `CONFIG.SHEET_NAME` → leave as `Submissions` unless you renamed the tab
   - `CONFIG.COACH_EMAIL` → where the "new submission" email goes (optional)
4. Save.

## 3. Deploy as a Web App

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone* ← required so the portal can call it
3. **Deploy**, then **Authorize access** and approve the **Sheets** (+ Gmail, if
   you set a coach email) scopes. Note: this script no longer needs the **Drive**
   scope — the browser handles Drive directly.
4. Copy the **Web app URL** (ends in `/exec`).

Open that URL in a browser — you should see
`{"ok":true,"service":"MPC Academy submissions","status":"ready"}`.

## 4. Point the portal at it

In the Next.js project's `.env.local`:

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-sheet-id                # optional (reference)
NEXT_PUBLIC_GOOGLE_SHEET_NAME=Submissions                # optional

# Direct Drive upload (see project README ▸ Google API setup):
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_NAME=MPC Academy Submissions
NEXT_PUBLIC_GOOGLE_DRIVE_SHARING=ANYONE_WITH_LINK
```

With the Apps Script URL unset the app runs against a built-in in-memory mock;
with the OAuth Client ID unset, uploads are skipped and only metadata is stored.

## Re-deploying after edits

**Deploy → Manage deployments → Edit → Version: New version → Deploy.**

## The API

Every response is `{ ok: boolean, data?, error? }`.

| Method | Request | Purpose |
| --- | --- | --- |
| `GET`  | `?action=list` | All submissions (coach dashboard) |
| `GET`  | `?action=list&email=x@y.com` | One member's submissions (My Progress) |
| `POST` | `{ action:"create", submission }` | Append a row; `submission.videoUrl` is the already-uploaded Drive link |
| `POST` | `{ action:"updateStatus", id, status }` | New / In Review / Completed |
| `POST` | `{ action:"updateFeedback", id, feedback, coachNotes? }` | Return feedback + complete |
| `POST` | `{ action:"updateProgressRating", id, rating }` | Set 0–100 rating |

Writes are sent as `text/plain` to avoid a CORS preflight the Apps Script
runtime can't answer; reads are simple GETs.

## Columns recorded per submission

| Column | Source |
| --- | --- |
| Submission ID / Timestamp | generated / submit time |
| Member Name / Email / Membership ID | member session |
| Analysis Type / Goal / Notes | wizard answers |
| Status | defaults to `New` |
| Assigned Coach / Coach Feedback / Coach Notes | coach actions |
| Completion Date | stamped when Status → Completed |
| Progress Rating | 0–100, set by coach |
| Video Filename | original uploaded filename |
| **Video URL** | Drive link — the browser uploaded the video and passed this in |
