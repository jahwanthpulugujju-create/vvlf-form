import { describe, expect, it, vi } from "vitest";
import { trackCaptionEngagement } from "./captionAnalytics";

describe("trackCaptionEngagement", () => {
  it("sends the caption placement with the supplied engagement event", () => {
    const tracker = { track: vi.fn() };

    trackCaptionEngagement("vvlf_caption_opened", tracker);

    expect(tracker.track).toHaveBeenCalledWith("vvlf_caption_opened", {
      placement: "student_image_caption",
    });
  });

  it("does not throw when analytics is unavailable", () => {
    expect(() => trackCaptionEngagement("vvlf_website_visit", undefined)).not.toThrow();
  });
});
