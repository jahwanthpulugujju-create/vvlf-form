/**
 * Live Spreadsheets Integration (Google Sheets + OneDrive Microsoft Excel Online)
 */

export interface ApplicationPayload {
  fullName: string;
  college: string;
  department: string;
  studyYear: string;
  whatsapp: string;
  email: string;
  track: string;
  tools: string[];
  focus: string;
  portfolioLink?: string | null;
  goal: string;
  workstation: string;
  consent: boolean;
  submittedAt?: string;
}

/**
 * Sync to Google Sheets via Google Apps Script Webhook
 */
export async function syncToGoogleSheets(data: ApplicationPayload): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return { success: false, error: "GOOGLE_SHEET_WEBHOOK_URL is not configured in .env" };
  }

  try {
    const payload = {
      ...data,
      submittedAt: data.submittedAt || new Date().toISOString(),
      toolsFormatted: Array.isArray(data.tools) ? data.tools.join(", ") : data.tools,
    };

    console.log(`[Google Sheets] Sending submission for "${data.fullName}" to Google Sheet...`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!response.ok && response.status !== 302) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Google Sheets] Webhook responded with HTTP ${response.status}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log(`[Google Sheets] Successfully synced submission for "${data.fullName}" to Google Sheet!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Google Sheets] Sync failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sync directly to OneDrive / Microsoft Excel Online via Webhook (Power Automate / Make / Zapier)
 */
export async function syncToExcelOnline(data: ApplicationPayload): Promise<{ success: boolean; error?: string }> {
  const excelWebhookUrl = process.env.EXCEL_WEBHOOK_URL || process.env.MICROSOFT_POWER_AUTOMATE_URL;
  if (!excelWebhookUrl || !excelWebhookUrl.startsWith("http")) {
    return { success: false, error: "EXCEL_WEBHOOK_URL is not configured in .env" };
  }

  try {
    const payload = {
      submittedAt: data.submittedAt || new Date().toISOString(),
      fullName: data.fullName,
      college: data.college,
      department: data.department,
      studyYear: data.studyYear,
      whatsapp: data.whatsapp,
      email: data.email,
      track: data.track,
      tools: Array.isArray(data.tools) ? data.tools.join(", ") : data.tools,
      focus: data.focus,
      portfolioLink: data.portfolioLink || "N/A",
      goal: data.goal,
      workstation: data.workstation,
      consent: data.consent ? "Yes" : "No",
    };

    console.log(`[Excel Online] Sending submission for "${data.fullName}" to OneDrive Excel...`);

    const response = await fetch(excelWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Excel Online] Webhook error HTTP ${response.status}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log(`[Excel Online] Successfully synced submission for "${data.fullName}" to OneDrive Excel!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Excel Online] Sync failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Trigger sync to all configured spreadsheets (Google Sheets and/or Excel Online)
 */
export async function syncAllSheets(data: ApplicationPayload) {
  const results = await Promise.allSettled([
    syncToGoogleSheets(data),
    syncToExcelOnline(data),
  ]);
  return results;
}
