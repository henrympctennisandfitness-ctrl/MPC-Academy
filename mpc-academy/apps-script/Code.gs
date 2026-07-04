/**
 * MPC Academy — Submissions backend (Google Apps Script Web App)
 * =============================================================================
 * PHASE 1 — GOOGLE SHEETS ONLY. This script is the entire backend: the Google
 * Sheet is the database and this Web App is the API in front of it. No custom
 * server, no Google Drive yet (videos are Phase 2 — see the FUTURE hook below).
 *
 * Flow:  Portal  ──GET──▶  read submissions (coach dashboard, member progress)
 *        Portal  ──POST─▶  create submission / update status / feedback / rating
 *
 * The portal sends/receives JSON. Writes are POSTed as `text/plain` to avoid a
 * CORS preflight the Apps Script runtime can't answer; reads are GET with query
 * params. Every response is the envelope:  { ok: boolean, data?, error? }
 *
 * -----------------------------------------------------------------------------
 * ACTIONS
 *   GET  ?action=list [&email=...]       → all rows (optionally one member's)
 *   POST { action: "create", submission } → append a new row
 *   POST { action: "updateStatus", id, status }
 *   POST { action: "updateFeedback", id, feedback, coachNotes? }
 *   POST { action: "updateProgressRating", id, rating }
 * -----------------------------------------------------------------------------
 */

// ===========================================================================
// Configuration — edit these, then Deploy ▸ New version.
// ===========================================================================
var CONFIG = {
  SHEET_ID: '',              // Google Sheet ID from its URL. REQUIRED.
  SHEET_NAME: 'Submissions', // Tab name (created on first run if absent).
  DEFAULT_STATUS: 'New',     // Status applied to every new submission.
  COACH_EMAIL: '',           // Optional: emailed when a new submission arrives.
};

/**
 * Column order in the Sheet. HEADERS is what a human sees; FIELDS are the
 * matching camelCase keys the portal uses. The two arrays MUST stay aligned —
 * this single mapping drives all row⇄object conversion.
 */
var HEADERS = [
  'Submission ID', 'Timestamp', 'Member Name', 'Member Email', 'Membership ID',
  'Analysis Type', 'Goal', 'Notes', 'Status', 'Assigned Coach',
  'Coach Feedback', 'Coach Notes', 'Completion Date', 'Progress Rating',
  'Video Filename', 'Video Placeholder',
];

var FIELDS = [
  'id', 'timestamp', 'memberName', 'memberEmail', 'membershipId',
  'analysisType', 'goal', 'notes', 'status', 'assignedCoach',
  'coachFeedback', 'coachNotes', 'completionDate', 'progressRating',
  'videoFilename', 'videoPlaceholder',
];

// Column numbers (1-based) for direct cell writes, derived from FIELDS.
var COL = {};
(function () { for (var i = 0; i < FIELDS.length; i++) COL[FIELDS[i]] = i + 1; })();

// ===========================================================================
// HTTP entry points
// ===========================================================================

/** Reads. `?action=list` returns rows; anything else is a health check. */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'list') {
      var email = e.parameter.email || '';
      return jsonResponse_({ ok: true, data: listSubmissions_(email) });
    }
    return jsonResponse_({ ok: true, service: 'MPC Academy submissions', status: 'ready' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: errText_(err) });
  }
}

/** Writes. Routes on the `action` field of the JSON body. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('Empty request body.');
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data;

    switch (action) {
      case 'create':
        data = createSubmission_(body.submission);
        break;
      case 'updateStatus':
        data = updateStatus_(body.id, body.status);
        break;
      case 'updateFeedback':
        data = updateFeedback_(body.id, body.feedback, body.coachNotes);
        break;
      case 'updateProgressRating':
        data = updateProgressRating_(body.id, body.rating);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }
    return jsonResponse_({ ok: true, data: data });
  } catch (err) {
    return jsonResponse_({ ok: false, error: errText_(err) });
  }
}

// ===========================================================================
// Operations
// ===========================================================================

/** Return every submission (newest first), optionally filtered by email. */
function listSubmissions_(email) {
  var rows = readAll_();
  if (email) {
    var target = String(email).toLowerCase();
    rows = rows.filter(function (r) {
      return String(r.memberEmail).toLowerCase() === target;
    });
  }
  return rows.sort(function (a, b) {
    return String(b.timestamp).localeCompare(String(a.timestamp));
  });
}

/**
 * Append one submission. Fills every field except the coach-only ones, defaults
 * Status, and records the video filename + placeholder (Drive upload = Phase 2).
 * Rejects duplicates and missing required fields.
 */
function createSubmission_(input) {
  if (!input) throw new Error('Missing submission payload.');

  ['memberName', 'memberEmail', 'membershipId', 'analysisType', 'goal'].forEach(function (key) {
    if (!input[key] || String(input[key]).trim() === '') {
      throw new Error('Missing required field: ' + key);
    }
  });

  var id = input.id ? String(input.id) : generateId_();
  if (findRowIndexById_(id) !== -1) {
    throw new Error('Duplicate submission — this ID already exists.');
  }

  var record = {
    id: id,
    timestamp: input.timestamp ? String(input.timestamp) : nowIso_(),
    memberName: String(input.memberName).trim(),
    memberEmail: String(input.memberEmail).trim(),
    membershipId: String(input.membershipId).trim(),
    analysisType: String(input.analysisType),
    goal: String(input.goal),
    notes: input.notes ? String(input.notes) : '',
    status: input.status ? String(input.status) : CONFIG.DEFAULT_STATUS,
    assignedCoach: input.assignedCoach ? String(input.assignedCoach) : '',
    coachFeedback: '',
    coachNotes: '',
    completionDate: '',
    progressRating: '',
    videoFilename: input.videoFilename ? String(input.videoFilename) : '',
    // FUTURE (Google Drive, Phase 2): upload the video here and store its URL
    // instead of this placeholder. Nothing else in the flow needs to change.
    videoPlaceholder: input.videoPlaceholder ? String(input.videoPlaceholder) : 'PENDING_DRIVE_UPLOAD',
  };

  getSheet_().appendRow(objectToRow_(record));
  notifyCoach_(record);
  return record;
}

/** Change a submission's status; stamps Completion Date when Completed. */
function updateStatus_(id, status) {
  var status_ = String(status || '');
  if (['New', 'In Review', 'Completed'].indexOf(status_) === -1) {
    throw new Error('Invalid status: ' + status_);
  }
  var rowIndex = requireRow_(id);
  var sheet = getSheet_();
  sheet.getRange(rowIndex, COL.status).setValue(status_);
  if (status_ === 'Completed') {
    sheet.getRange(rowIndex, COL.completionDate).setValue(nowIso_());
  }
  return rowToObject_(readRow_(rowIndex));
}

/** Return written feedback (+ optional private notes) and mark Completed. */
function updateFeedback_(id, feedback, coachNotes) {
  var rowIndex = requireRow_(id);
  var sheet = getSheet_();
  sheet.getRange(rowIndex, COL.coachFeedback).setValue(String(feedback || ''));
  if (coachNotes !== undefined && coachNotes !== null) {
    sheet.getRange(rowIndex, COL.coachNotes).setValue(String(coachNotes));
  }
  sheet.getRange(rowIndex, COL.status).setValue('Completed');
  if (!sheet.getRange(rowIndex, COL.completionDate).getValue()) {
    sheet.getRange(rowIndex, COL.completionDate).setValue(nowIso_());
  }
  return rowToObject_(readRow_(rowIndex));
}

/** Set the 0–100 progress rating a coach assigns. */
function updateProgressRating_(id, rating) {
  var value = Number(rating);
  if (isNaN(value) || value < 0 || value > 100) {
    throw new Error('Progress rating must be a number between 0 and 100.');
  }
  var rowIndex = requireRow_(id);
  getSheet_().getRange(rowIndex, COL.progressRating).setValue(value);
  return rowToObject_(readRow_(rowIndex));
}

// ===========================================================================
// Sheet access + row conversion
// ===========================================================================

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

/** All data rows as objects (header row excluded). */
function readAll_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, FIELDS.length).getValues();
  return values.map(rowToObject_);
}

/** Read a single row's raw values by 1-based sheet row index. */
function readRow_(rowIndex) {
  return getSheet_().getRange(rowIndex, 1, 1, FIELDS.length).getValues()[0];
}

/** Find a submission's sheet row (1-based) by ID, or -1 if not present. */
function findRowIndexById_(id) {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, COL.id, lastRow - 1, 1).getValues();
  var target = String(id);
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === target) return i + 2; // +2: skip header, 1-based
  }
  return -1;
}

/** Like findRowIndexById_ but throws a clear error when missing. */
function requireRow_(id) {
  if (!id) throw new Error('Missing submission id.');
  var idx = findRowIndexById_(id);
  if (idx === -1) throw new Error('Submission not found: ' + id);
  return idx;
}

/** Raw row values → typed object, keyed by FIELDS. */
function rowToObject_(row) {
  var obj = {};
  for (var i = 0; i < FIELDS.length; i++) {
    var key = FIELDS[i];
    var val = row[i];
    if (key === 'timestamp' || key === 'completionDate') {
      obj[key] = (val instanceof Date) ? val.toISOString() : (val ? String(val) : '');
    } else if (key === 'progressRating') {
      obj[key] = (val === '' || val === null || val === undefined) ? '' : Number(val);
    } else {
      obj[key] = (val === null || val === undefined) ? '' : String(val);
    }
  }
  return obj;
}

/** Typed object → row array in FIELDS/HEADERS order. */
function objectToRow_(obj) {
  return FIELDS.map(function (key) {
    var v = obj[key];
    return (v === undefined || v === null) ? '' : v;
  });
}

// ===========================================================================
// Utilities
// ===========================================================================

/** Notify the coach of a new submission. Best-effort — never breaks intake. */
function notifyCoach_(record) {
  if (!CONFIG.COACH_EMAIL) return;
  try {
    MailApp.sendEmail({
      to: CONFIG.COACH_EMAIL,
      subject: 'New submission — ' + record.analysisType + ' from ' + record.memberName,
      body: [
        'A new analysis has been submitted.', '',
        'Member:     ' + record.memberName + ' (' + record.membershipId + ')',
        'Email:      ' + record.memberEmail,
        'Analysis:   ' + record.analysisType,
        'Goal:       ' + record.goal,
        'Notes:      ' + (record.notes || '—'),
        'Video file: ' + (record.videoFilename || '—') + ' (upload pending — Phase 2)',
        'Status:     ' + record.status,
      ].join('\n'),
    });
  } catch (mailErr) {
    // Quota/permission issue — non-fatal.
  }
}

/** Unique, sortable-ish ID, e.g. "MPC-LXY2A1-9F3B". */
function generateId_() {
  var time = Date.now().toString(36).toUpperCase();
  var rand = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase();
  return 'MPC-' + time + '-' + rand;
}

/** Current time as an ISO string (matches what the portal sends). */
function nowIso_() {
  return new Date().toISOString();
}

/** Safe error-message extraction. */
function errText_(err) {
  return String((err && err.message) || err);
}

/** JSON response helper. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
