export type FunnelEvent =
  | "landing_view"
  | "step_start"
  | "step_complete"
  | "category_selected"
  | "secondary_category_selected"
  | "search_query_used"
  | "skills_selected"
  | "proof_of_work_provided"
  | "proof_of_work_skipped"
  | "application_submitted"
  | "share_whatsapp_clicked"
  | "copy_link_clicked"
  | "about_modal_opened";

export interface UmamiTracker {
  track: (eventName: string, eventData?: Record<string, any>) => void;
}

export function trackFunnelEvent(
  eventName: FunnelEvent,
  data?: Record<string, any>,
  tracker: UmamiTracker | undefined = (globalThis as any).umami
) {
  try {
    const timestamp = new Date().toISOString();
    const eventPayload = {
      ...data,
      timestamp,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    };

    if (tracker && typeof tracker.track === "function") {
      tracker.track(eventName, eventPayload);
    }

    // Console logging in dev mode
    if (import.meta.env.DEV) {
      console.log(`[Analytics: ${eventName}]`, eventPayload);
    }
  } catch (err) {
    // Fail silently so user flow is never interrupted
  }
}
