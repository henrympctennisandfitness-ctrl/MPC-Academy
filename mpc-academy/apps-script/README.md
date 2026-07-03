# Google Apps Script — deployment

This is the whole backend: one Apps Script Web App that receives a submission,
stores the video in Drive, records a row in Sheets, and emails the coach.

## 1. Create the Sheet

1. Create a new Google Sheet. Name it e.g. **MPC Academy — Submissions**.
2. Copy its **ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
   (You don't need to add headers — the script adds them on the first run.)

## 2. Create the script

1. Go to https://script.google.com → **New project**.
2. Delete the starter code, paste in `Code.gs` from this folder.
3. At the top of the file, set:
   - `CONFIG.SHEET_ID` → the ID from step 1 (**required**)
   - `CONFIG.COACH_EMAIL` → where the notification email goes (optional)
   - `CONFIG.FOLDER_NAME` → leave as-is or rename the Drive folder
4. Save.

## 3. Deploy as a Web App

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*  ← required so the portal can call it
3. **Deploy**, then **Authorize access** and approve the Drive / Sheets / Gmail
   scopes (you'll see a "Google hasn't verified this app" screen — it's your own
   script; continue).
4. Copy the **Web app URL** (ends in `/exec`).

Open that URL in a browser — you should see
`{"ok":true,"service":"MPC Academy intake","status":"ready"}`.

## 4. Point the portal at it

In the Next.js project, create `.env.local`:

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
```

Restart `npm run dev`. The Submit wizard now uploads for real. With the URL
unset, the wizard runs in simulated mode so development still works.

## Re-deploying after edits

Editing `Code.gs` doesn't change the live URL automatically. Either
**Deploy → Manage deployments → Edit → Version: New version**, or create a new
deployment (which gives a new URL you'd paste into `.env.local`).

## Important limit — video size

Apps Script Web Apps cap the request body at roughly **50 MB**, and base64
encoding inflates a file by ~33%. In practice this path handles clips up to
about **40 MB** (the portal enforces this before uploading). For full-length
match footage you'll want a resumable upload straight to Drive via the Drive
API — that's the intended next step and slots in behind the same
`uploadSubmission()` function without touching the UI.

## Data recorded per submission

| Column | Source |
| --- | --- |
| Date | server timestamp |
| Member Name / Email / Membership ID | portal (member session) |
| Analysis Type / Goal / Notes | wizard answers |
| Video URL | Drive file link |
| Status | defaults to `New` |
