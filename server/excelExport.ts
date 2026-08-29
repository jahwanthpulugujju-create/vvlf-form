import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { listApplications } from "./db";

const CSV_FILE_PATH = path.resolve(import.meta.dirname, "../data/VVLF_Student_Applications.csv");

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function generateCsvString(): Promise<string> {
  const applications = await listApplications();
  const headers = [
    "ID",
    "Submission Date (IST)",
    "Full Name",
    "College / University",
    "Department / Branch",
    "Current Year",
    "WhatsApp Number",
    "Email Address",
    "Focus Track",
    "Tools & Capabilities",
    "Focus / Approach",
    "Portfolio / Project Link",
    "Primary Goal",
    "Workstation Access",
    "Consent Confirmed",
  ];

  const rows: string[] = [headers.join(",")];

  for (const app of applications) {
    let toolsText = "";
    try {
      const parsed = JSON.parse(app.tools || "[]");
      toolsText = Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
    } catch {
      toolsText = app.tools || "";
    }

    const dateStr = app.createdAt
      ? new Date(app.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "";

    const row = [
      escapeCsvField(app.id),
      escapeCsvField(dateStr),
      escapeCsvField(app.fullName),
      escapeCsvField(app.college),
      escapeCsvField(app.department),
      escapeCsvField(app.studyYear),
      escapeCsvField(app.whatsapp),
      escapeCsvField(app.email),
      escapeCsvField(app.track),
      escapeCsvField(toolsText),
      escapeCsvField(app.focus),
      escapeCsvField(app.portfolioLink || "N/A"),
      escapeCsvField(app.goal),
      escapeCsvField(app.workstation),
      escapeCsvField(app.consent ? "Yes" : "No"),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\r\n");
}

export async function updateLocalCsvFile(): Promise<void> {
  try {
    const csvContent = await generateCsvString();
    const dir = path.dirname(CSV_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Add UTF-8 BOM so Excel opens special characters and Indian phone numbers cleanly
    fs.writeFileSync(CSV_FILE_PATH, "\uFEFF" + csvContent, "utf-8");
    console.log(`[Excel Export] Updated Excel/CSV file at: ${CSV_FILE_PATH}`);
  } catch (error) {
    console.error("[Excel Export] Failed to update local CSV file:", error);
  }
}

export function registerExcelExportRoute(app: Express) {
  const handler = async (_req: Request, res: Response) => {
    try {
      const csvContent = await generateCsvString();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="VVLF_Student_Applications_${new Date().toISOString().slice(0, 10)}.csv"`
      );
      // UTF-8 BOM for Microsoft Excel
      res.status(200).send("\uFEFF" + csvContent);
    } catch (error) {
      console.error("[Excel Export] Error generating export:", error);
      res.status(500).send("Error generating spreadsheet export");
    }
  };

  app.get("/api/export-csv", handler);
  app.get("/api/export-excel", handler);
}
