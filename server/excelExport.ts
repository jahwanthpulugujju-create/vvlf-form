import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { listApplications } from "./db";

function getCsvFilePath(): string {
  try {
    const defaultPath = path.resolve(import.meta.dirname, "../data/VVLF_Student_Applications.csv");
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  } catch {
    return path.join(os.tmpdir(), "VVLF_Student_Applications.csv");
  }
}

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
    "Primary Category",
    "Secondary Category",
    "Work Areas",
    "Skills & Capabilities",
    "Proof of Work / Link 1",
    "Proof of Work / Link 2",
    "Availability Hours",
    "Goals",
    "Contribution Note",
    "Recommended Internal Role",
    "Consent Confirmed",
  ];

  const rows: string[] = [headers.join(",")];

  for (const app of applications) {
    let toolsText = "";
    let secondaryCategory = "";
    let workAreas = "";
    let recommendedRole = "";
    let learningInterest = "";

    try {
      const parsed = JSON.parse(app.tools || "{}");
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        toolsText = Array.isArray(parsed.skills) ? parsed.skills.join(", ") : "";
        secondaryCategory = parsed.secondaryCategory || "";
        workAreas = Array.isArray(parsed.workAreas) ? parsed.workAreas.join(", ") : "";
        recommendedRole = parsed.recommendedRole || "";
        learningInterest = parsed.learningInterest || "";
      } else if (Array.isArray(parsed)) {
        toolsText = parsed.join(", ");
      } else {
        toolsText = String(parsed);
      }
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
      escapeCsvField(secondaryCategory || "N/A"),
      escapeCsvField(workAreas || app.focus),
      escapeCsvField(toolsText),
      escapeCsvField(app.portfolioLink || "N/A"),
      escapeCsvField("N/A"),
      escapeCsvField(app.workstation || "8–12 hours"),
      escapeCsvField(app.goal),
      escapeCsvField(learningInterest || "N/A"),
      escapeCsvField(recommendedRole || "VVLF Student Builder"),
      escapeCsvField(app.consent ? "Yes" : "No"),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\r\n");
}

export async function updateLocalCsvFile(): Promise<void> {
  try {
    const csvFilePath = getCsvFilePath();
    const csvContent = await generateCsvString();
    const dir = path.dirname(csvFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Add UTF-8 BOM so Excel opens special characters and Indian phone numbers cleanly
    fs.writeFileSync(csvFilePath, "\uFEFF" + csvContent, "utf-8");
    console.log(`[Excel Export] Updated Excel/CSV file at: ${csvFilePath}`);
  } catch (error) {
    console.warn("[Excel Export] Local CSV file update skipped (read-only filesystem):", error);
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
