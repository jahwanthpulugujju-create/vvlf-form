import { describe, expect, it } from "vitest";
import { applicationInputSchema, isSafeRedirectUrl } from "./application";

const validApplication = {
  fullName: "Sample Applicant",
  college: "Vishnu Institute of Technology",
  department: "CSE",
  studyYear: "2nd Year" as const,
  whatsapp: "+91 9876543210",
  email: "sample@example.com",
  track: "Tech & Web" as const,
  tools: ["Web Basics (HTML/CSS/JS)"],
  focus: "Debug line-by-line",
  portfolioLink: "",
  goal: "Build real projects to boost my resume" as const,
  workstation: "I have my own personal laptop" as const,
  consent: true as const,
};

describe("VVLF application validation", () => {
  it("accepts a complete public application", () => {
    expect(applicationInputSchema.safeParse(validApplication).success).toBe(true);
  });

  it("rejects a submission without consent or a selected capability", () => {
    const result = applicationInputSchema.safeParse({ ...validApplication, consent: false, tools: [] });
    expect(result.success).toBe(false);
  });

  it("permits only web redirect URLs", () => {
    expect(isSafeRedirectUrl("https://vvlf.example/thank-you")).toBe(true);
    expect(isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectUrl("not-a-url")).toBe(false);
  });
});
