/**
 * ============================================================================
 * VVLF Student Builder Program - Google Apps Script Backend (v2.0)
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.google.com) and create/open your Spreadsheet.
 *    Name it: "VVLF Student Builder Program Applications"
 * 2. Click "Extensions" in the top menu -> select "Apps Script".
 * 3. Paste ALL the code below into Code.gs.
 * 4. Click "Deploy" (top right button) -> "New deployment" (or "Manage deployments" -> Edit -> New version).
 * 5. Under "Select type" (gear icon) -> select "Web app".
 * 6. Set:
 *    - Description: "VVLF Student Builder Form Webhook v2"
 *    - Execute as: "Me (<your-email>)"
 *    - Who has access: "Anyone"
 * 7. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL".
 * 8. In your project's .env file, ensure the URL is set:
 *    GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
 * ============================================================================
 */

// Define Column Headers
const HEADERS = [
  "Submission Time (IST)",
  "Full Name",
  "College / University",
  "Department / Branch",
  "Current Year",
  "WhatsApp Number",
  "Email Address",
  "Primary Category",
  "Secondary Category",
  "Work Areas",
  "Skills & Capabilities",
  "Proof of Work / Link 1",
  "Proof of Work Link 2 / Notes",
  "Weekly Availability",
  "Commitment Duration",
  "Start Timeline",
  "Motivation Goals",
  "Candidate Contribution",
  "Recommended Internal Role",
  "Consent Confirmed"
];

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    
    // Format Header Row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1d4ed8"); // VVLF Blue
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds to avoid concurrency collisions

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupSheet(sheet);

    // Parse incoming JSON
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("No data received");
    }

    // Format IST Timestamp
    const timestamp = Utilities.formatDate(
      new Date(),
      "Asia/Kolkata",
      "yyyy-MM-dd HH:mm:ss"
    );

    // Format Arrays
    const skillsText = Array.isArray(data.skills)
      ? data.skills.join(", ")
      : (data.toolsFormatted || data.tools || "");

    const workAreasText = Array.isArray(data.workAreas)
      ? data.workAreas.join(", ")
      : (data.workAreasFormatted || data.focus || "");

    const goalsText = Array.isArray(data.goals)
      ? data.goals.join(", ")
      : (data.goalsFormatted || data.goal || "");

    const proofLink = data.proofOfWorkLink || data.portfolioLink || (data.noWorkToShare ? "No link yet" : "N/A");
    const proofLink2 = data.proofOfWorkLink2 || (data.learningInterest ? "Learning goal: " + data.learningInterest : "N/A");

    // Construct Row Data
    const row = [
      timestamp,
      data.fullName || "",
      data.college || "",
      data.department || "",
      data.studyYear || "",
      data.whatsapp ? "'" + data.whatsapp : "", // Leading quote prevents phone number truncation
      data.email || "",
      data.category || data.track || "",
      data.secondaryCategory || "None",
      workAreasText,
      skillsText,
      proofLink,
      proofLink2,
      data.availabilityHours || "8–12 hours",
      data.availabilityDuration || "6 months",
      data.startTimeline || "Immediately",
      goalsText,
      data.contribution || "N/A",
      data.recommendedRole || "VVLF Student Builder",
      data.consent ? "Yes" : "No"
    ];

    // Append to sheet
    sheet.appendRow(row);

    // Style the new row
    const lastRow = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRow, 1, 1, HEADERS.length);
    rowRange.setFontSize(9);
    rowRange.setVerticalAlignment("middle");
    
    // Auto-fit column widths if below 15 rows
    if (lastRow <= 15) {
      for (let c = 1; c <= HEADERS.length; c++) {
        sheet.autoResizeColumn(c);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", row: lastRow, recommendedRole: data.recommendedRole }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "VVLF Student Builder Program Google Sheets Webhook is active!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
