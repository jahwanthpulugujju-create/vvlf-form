import { describe, expect, it } from "vitest";
import { validateStudioResponse, type PublicStudioQuestion } from "./formStudio";

const questions: PublicStudioQuestion[] = [
  { id: 1, kind: "short_text", label: "Name", helpText: "", options: [], required: true, position: 0 },
  { id: 2, kind: "email", label: "Email", helpText: "", options: [], required: true, position: 1 },
  { id: 3, kind: "single_choice", label: "Track", helpText: "", options: ["Design", "Tech"], required: true, position: 2 },
  { id: 4, kind: "multiple_choice", label: "Tools", helpText: "", options: ["Figma", "React"], required: false, position: 3 },
  { id: 5, kind: "consent", label: "Privacy consent", helpText: "", options: [], required: true, position: 4 },
];

describe("validateStudioResponse", () => {
  it("keeps only valid answers for the dynamic question configuration", () => {
    const answers = validateStudioResponse(questions, {
      "1": "  Priya  ",
      "2": "priya@example.com",
      "3": "Tech",
      "4": ["React"],
      "5": true,
      ignored: "not stored",
    });

    expect(answers).toEqual({ "1": "Priya", "2": "priya@example.com", "3": "Tech", "4": ["React"], "5": true });
  });

  it("requires consent and rejects values outside configured choices", () => {
    expect(() => validateStudioResponse(questions, { "1": "Priya", "2": "priya@example.com", "3": "Other" })).toThrow("Choose a valid option for: Track");
    expect(() => validateStudioResponse(questions, { "1": "Priya", "2": "priya@example.com", "3": "Tech", "5": false })).toThrow("Please confirm: Privacy consent");
  });
});
