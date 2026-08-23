import { describe, expect, it } from "vitest";
import { remainingRequiredPrompts, TOTAL_REQUIRED_PROMPTS } from "./applicationProgress";

describe("application progress", () => {
  it("reports every required prompt as remaining for a blank form", () => {
    expect(remainingRequiredPrompts([])).toBe(TOTAL_REQUIRED_PROMPTS);
  });

  it("subtracts only completed required prompts", () => {
    expect(remainingRequiredPrompts(["name", "college", false, "track"])).toBe(TOTAL_REQUIRED_PROMPTS - 3);
  });
});
