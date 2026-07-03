/**
 * MPC Academy — Submission intake (Google Apps Script Web App)
 * -----------------------------------------------------------------------------
 * Flow:  Portal  →  Web App (this script)  →  Google Drive (video)
 *                                          →  Google Sheets (row)
 *                                          →  Coach email notification
 *
 * No backend server is involved. Paste this into a Google Apps Script project
 * and deploy it as a Web App (see apps-script/README.md for step-by-step).
 *
 * The portal sends a JSON body (as text/plain to avoid a CORS preflight the
 * Apps Script runtime can't answer) shaped like:
 *   { name, email, membershipId, analysisType, goal, notes,
 *     fileName, mimeType, fileData }   // fileData = base64, no data: prefix
 */

// ---------------------------------------------------------------------------
// Configuration — edit these three, redeploy, done.
// ---------------------------------------------------------------------------
var CONFIG = {
  FOLDER_NAME: 'MPC Academy — Video Submissions', // created in Drive if absent
  SHEET_ID: '',            // Google Sheet ID (from its URL). Required.
  SHEET_NAME: 'Submissions',
  COACH_EMAIL: '',         // where the "new submission" email goes. Optional.
  SHARE_VIDEO_LINK: true,  // make each video viewable by anyone with the link
  DEFAULT_STATUS: 'New',
};

var HEADERS = [
  'Date', 'Member Name', 'Email', 'Membership ID',
  'Analysis Type', 'Goal', 'Notes', 'Video URL', 'Status',
];

// ---------------------------------------------------------------------------
// HTTP entry points
// ---------------------------------------------------------------------------

/** Handles the submission POST from the portal. */
function doPost(e) {
  try {
    var payload = parseRequest_(e);
    var folder = getOrCreateFolder_(CONFIG.FOLDER_NAME);
    var videoUrl = saveVideo_(folder, payload);
    var row = appendRow_(payload, videoUrl, CONFIG.DEFAULT_STATUS);
    notifyCoach_(payload, videoUrl); // best-effort; never fails the request
    return jsonResponse_({
      ok: true,
      videoUrl: videoUrl,
      row: row,
      message: 'Submission received.',
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String((err && err.message) || err) });
  }
}

/** Health check — open the /exec URL in a browser to confirm it's live. */
function doGet() {
  return jsonResponse_({ ok: true, service: 'MPC Academy intake', status: 'ready' });
}

// ---------------------------------------------------------------------------
// Steps (each does one job)
// ---------------------------------------------------------------------------

/** Parse + validate the incoming JSON body. */
function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Empty request body.');
  }
  var data = JSON.parse(e.postData.contents);

  ['name', 'email', 'membershipId', 'analysisType', 'goal'].forEach(function (key) {
    if (!data[key]) throw new Error('Missing required field: ' + key);
  });

  return {
    name: String(data.name),
    email: String(data.email),
    membershipId: String(data.membershipId),
    analysisType: String(data.analysisType),
    goal: String(data.goal),
    notes: data.notes ? String(data.notes) : '',
    fileName: data.fileName ? String(data.fileName) : 'video',
    mimeType: data.mimeType ? String(data.mimeType) : 'application/octet-stream',
    fileData: data.fileData ? String(data.fileData) : '',
  };
}

/** Find the submissions folder, creating it the first time. */
function getOrCreateFolder_(name) {
  var existing = DriveApp.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(name);
}

/** Decode the base64 video, store it in Drive, return a shareable URL. */
function saveVideo_(folder, p) {
  if (!p.fileData) return ''; // allow rows without a video, just in case

  var bytes = Utilities.base64Decode(p.fileData);
  var stamp = new Date().toISOString().replace(/[:.]/g, '-');
  var safeName = (p.membershipId + '_' + p.analysisType + '_' + stamp + '_' + p.fileName)
    .replace(/[\/\\?%*:|"<>]/g, '-');

  var blob = Utilities.newBlob(bytes, p.mimeType, safeName);
  var file = folder.createFile(blob);

  if (CONFIG.SHARE_VIDEO_LINK) {
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Org policy may block link sharing — the file is still saved.
    }
  }
  return file.getUrl();
}

/** Open the sheet (creating headers once) and append one submission row. */
function appendRow_(p, videoUrl, status) {
  var sheet = getSheet_();
  sheet.appendRow([
    new Date(),        // Date
    p.name,            // Member Name
    p.email,           // Email
    p.membershipId,    // Membership ID
    p.analysisType,    // Analysis Type
    p.goal,            // Goal
    p.notes,           // Notes
    videoUrl,          // Video URL
    status,            // Status
  ]);
  return sheet.getLastRow();
}

/** Email the coach. Wrapped so quota/permission issues never break intake. */
function notifyCoach_(p, videoUrl) {
  if (!CONFIG.COACH_EMAIL) return;
  var subject = 'New submission — ' + p.analysisType + ' from ' + p.name;
  var body = [
    'A new analysis has been submitted.', '',
    'Member:      ' + p.name + ' (' + p.membershipId + ')',
    'Email:       ' + p.email,
    'Analysis:    ' + p.analysisType,
    'Goal:        ' + p.goal,
    'Notes:       ' + (p.notes || '—'),
    'Video:       ' + (videoUrl || '—'),
  ].join('\n');
  try {
    MailApp.sendEmail({ to: CONFIG.COACH_EMAIL, subject: subject, body: body });
  } catch (mailErr) {
    // Non-fatal.
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the target sheet, adding a bold frozen header row on first use. */
function getSheet_() {
  var ss = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet found. Set CONFIG.SHEET_ID.');

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** JSON response helper. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
