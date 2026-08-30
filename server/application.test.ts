import { describe, expect, it } from "vitest";
import { applicationInputSchema, enrichApplicationData, isSafeRedirectUrl } from "./application";

const validApplication = {
  fullName: "Sample Applicant",
  college: "Vishnu Institute of Technology",
  department: "CSE",
  studyYear: "2nd Year" as const,
  whatsapp: "9876543210",
  email: "sample@example.com",
  category: "Technology & Product",
  workAreas: ["Web Development", "AI"],
  skills: ["React", "Python"],
  proofOfWorkLink: "https://github.com/sample/repo",
  availabilityHours: "8–12 hours",
  availabilityDuration: "6 months",
  startTimeline: "Immediately",
  goals: ["Build real projects"],
  contribution: "I want to build full-stack web tools.",
  consent: true as const,
};

describe("VVLF application validation", () => {
  it("accepts a complete public application", () => {
    const parsed = applicationInputSchema.safeParse(validApplication);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const enriched = enrichApplicationData(parsed.data);
      expect(enriched.recommendedRole).toBe("AI & Automation Engineering Intern");
    }
  });

  it("rejects a submission without consent or empty skills", () => {
    const result = applicationInputSchema.safeParse({
      ...validApplication,
      consent: false,
      skills: [],
    });
    expect(result.success).toBe(false);
  });

  it("permits only web redirect URLs", () => {
    expect(isSafeRedirectUrl("https://vvlf.example/thank-you")).toBe(true);
    expect(isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectUrl("not-a-url")).toBe(false);
  });
});
