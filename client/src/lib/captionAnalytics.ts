export type CaptionEngagementEvent = "vvlf_caption_opened" | "vvlf_website_visit";

export type UmamiTracker = {
  track: (eventName: string, eventData?: Record<string, string>) => void;
};

export function trackCaptionEngagement(
  eventName: CaptionEngagementEvent,
  tracker: UmamiTracker | undefined = (globalThis as typeof globalThis & { umami?: UmamiTracker }).umami,
) {
  tracker?.track(eventName, { placement: "student_image_caption" });
}
