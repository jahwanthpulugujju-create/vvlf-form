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
  category?: string;
  track?: string;
  secondaryCategory?: string;
  workAreas?: string[];
  skills?: string[];
  tools?: string[];
  focus?: string;
  proofOfWorkLink?: string | null;
  proofOfWorkLink2?: string | null;
  portfolioLink?: string | null;
  noWorkToShare?: boolean;
  learningInterest?: string;
  availabilityHours?: string;
  availabilityDuration?: string;
  startTimeline?: string;
  goals?: string[];
  goal?: string;
  contribution?: string;
  workstation?: string;
  recommendedRole?: string;
  consent: boolean;
  submittedAt?: string;
}

const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbz94rbvo1Lg83JM2gdLBOKoIf9pfhcaNH9fWHp4WD8v_8YmEWix4-hZr9jXZSZY5VJy/exec";

/**
 * Sync to Google Sheets via Google Apps Script Webhook
 */
export async function syncToGoogleSheets(data: ApplicationPayload): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return { success: false, error: "GOOGLE_SHEET_WEBHOOK_URL is not configured" };
  }

  try {
    const toolsArray = data.skills || data.tools || [];
    const workAreasArray = data.workAreas || [];
    const goalsArray = data.goals || (data.goal ? [data.goal] : []);

    const payload = {
      ...data,
      category: data.category || data.track || "",
      track: data.category || data.track || "",
      secondaryCategory: data.secondaryCategory || "",
      workAreas: workAreasArray,
      workAreasFormatted: workAreasArray.join(", "),
      skills: toolsArray,
      tools: toolsArray,
      toolsFormatted: toolsArray.join(", "),
      proofOfWorkLink: data.proofOfWorkLink || data.portfolioLink || "",
      proofOfWorkLink2: data.proofOfWorkLink2 || "",
      portfolioLink: data.proofOfWorkLink || data.portfolioLink || "",
      availabilityHours: data.availabilityHours || "8–12 hours",
      availabilityDuration: data.availabilityDuration || "6 months",
      startTimeline: data.startTimeline || "Immediately",
      goalsFormatted: goalsArray.join(", "),
      goal: goalsArray.join(", "),
      contribution: data.contribution || "",
      recommendedRole: data.recommendedRole || "VVLF Student Builder",
      submittedAt: data.submittedAt || new Date().toISOString(),
    };

    console.log(`[Google Sheets] Sending submission for "${data.fullName}" (${payload.recommendedRole}) to Google Sheet...`);

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
 * Sync directly to OneDrive / Microsoft Excel Online via Webhook
 */
export async function syncToExcelOnline(data: ApplicationPayload): Promise<{ success: boolean; error?: string }> {
  const excelWebhookUrl = process.env.EXCEL_WEBHOOK_URL || process.env.MICROSOFT_POWER_AUTOMATE_URL;
  if (!excelWebhookUrl || !excelWebhookUrl.startsWith("http")) {
    return { success: false, error: "EXCEL_WEBHOOK_URL is not configured in .env" };
  }

  try {
    const toolsArray = data.skills || data.tools || [];
    const workAreasArray = data.workAreas || [];
    const goalsArray = data.goals || (data.goal ? [data.goal] : []);

    const payload = {
      submittedAt: data.submittedAt || new Date().toISOString(),
      fullName: data.fullName,
      college: data.college,
      department: data.department,
      studyYear: data.studyYear,
      whatsapp: data.whatsapp,
      email: data.email,
      category: data.category || data.track || "",
      secondaryCategory: data.secondaryCategory || "N/A",
      workAreas: workAreasArray.join(", "),
      skills: toolsArray.join(", "),
      proofOfWorkLink: data.proofOfWorkLink || data.portfolioLink || "N/A",
      proofOfWorkLink2: data.proofOfWorkLink2 || "N/A",
      availabilityHours: data.availabilityHours || "8–12 hours",
      availabilityDuration: data.availabilityDuration || "6 months",
      startTimeline: data.startTimeline || "Immediately",
      goals: goalsArray.join(", "),
      contribution: data.contribution || "N/A",
      recommendedRole: data.recommendedRole || "N/A",
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
