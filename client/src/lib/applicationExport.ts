const headings = ["Submitted", "Name", "College", "Department", "Year", "WhatsApp", "Email", "Track", "Tools", "Focus", "Portfolio", "Goal", "Workstation"];

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

export function applicationsCsv(rows: Array<Record<string, unknown>>) {
  const data = rows.map((row) => [
    new Date(String(row.createdAt)).toLocaleString(), row.fullName, row.college, row.department, row.studyYear,
    row.whatsapp, row.email, row.track, Array.isArray(row.tools) ? row.tools.join("; ") : row.tools,
    row.focus, row.portfolioLink, row.goal, row.workstation,
  ].map(csvCell).join(","));
  return [headings.map(csvCell).join(","), ...data].join("\n");
}
