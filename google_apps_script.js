/**
 * ============================================================================
 * VVLF Student Innovation & Portfolio Track - Google Apps Script Backend
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.google.com) and create a new Spreadsheet.
 *    Name it: "VVLF Application Submissions"
 * 2. Click "Extensions" in the top menu -> select "Apps Script".
 * 3. Delete any existing code in Code.gs and paste ALL the code below.
 * 4. Click "Deploy" (top right button) -> "New deployment".
 * 5. Under "Select type" (gear icon) -> select "Web app".
 * 6. Set:
 *    - Description: "VVLF Form Webhook"
 *    - Execute as: "Me (<your-email>)"
 *    - Who has access: "Anyone"
 * 7. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL".
 * 8. In your project's .env file, paste the URL:
 *    GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
 * 9. Restart your backend server (pnpm run dev).
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
  "Chosen Track",
  "Tools & Capabilities",
  "Focus / Working Approach",
  "Portfolio / Project Link",
  "Primary Goal",
  "Workstation Access",
  "Consent Confirmed"
];

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    // Append headers if sheet is brand new
    sheet.appendRow(HEADERS);
    
    // Format Header Row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1d4ed8"); // VVLF Blue
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
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

    // Tools formatting (array or string)
    let toolsText = "";
    if (Array.isArray(data.tools)) {
      toolsText = data.tools.join(", ");
    } else if (data.toolsFormatted) {
      toolsText = data.toolsFormatted;
    } else if (data.tools) {
      toolsText = String(data.tools);
    }

    // Construct Row Data
    const row = [
      timestamp,
      data.fullName || "",
      data.college || "",
      data.department || "",
      data.studyYear || "",
      data.whatsapp ? "'" + data.whatsapp : "", // Leading quote prevents phone number truncation
      data.email || "",
      data.track || "",
      toolsText,
      data.focus || "",
      data.portfolioLink || "N/A",
      data.goal || "",
      data.workstation || "",
      data.consent ? "Yes" : "No"
    ];

    // Append to sheet
    sheet.appendRow(row);

    // Style the new row
    const lastRow = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRow, 1, 1, HEADERS.length);
    rowRange.setFontSize(9);
    rowRange.setVerticalAlignment("middle");
    
    // Auto-fit column widths if below 10 rows
    if (lastRow <= 10) {
      for (let c = 1; c <= HEADERS.length; c++) {
        sheet.autoResizeColumn(c);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", row: lastRow }))
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
    .createTextOutput(JSON.stringify({ status: "active", message: "VVLF Google Sheets webhook is live!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
