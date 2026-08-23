import { describe, expect, it } from "vitest";
import { applicationsCsv } from "./applicationExport";

describe("application CSV export", () => {
  it("exports the fields an administrator needs and safely escapes quotations", () => {
    const csv = applicationsCsv([{ createdAt: "2026-08-23T00:00:00.000Z", fullName: 'Asha "AJ" Rao', college: "VVIT", department: "CSE", studyYear: "2nd Year", whatsapp: "+919000000000", email: "asha@example.com", track: "Tech & Web", tools: ["Git & GitHub", "Python"], focus: "Debug line-by-line", portfolioLink: "", goal: "Build real projects to boost my resume", workstation: "I have my own personal laptop" }]);
    expect(csv).toContain('"Name"');
    expect(csv).toContain('"Asha ""AJ"" Rao"');
    expect(csv).toContain('"Git & GitHub; Python"');
  });
});
