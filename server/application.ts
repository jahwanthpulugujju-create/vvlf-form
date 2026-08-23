import { z } from "zod";

export const trackOptions = [
  "Design & Visuals",
  "Video & Media",
  "Tech & Web",
  "Content & Events",
  "Fast Learner / Generalist",
] as const;

export const studyYearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export const goalOptions = [
  "Build real projects to boost my resume",
  "Learn modern tools & AI workflows",
  "Gain leadership & event experience",
  "Connect with peers and mentors",
] as const;

export const workstationOptions = [
  "I have my own personal laptop",
  "I will use campus systems and foundation labs",
] as const;

export const applicationInputSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(150),
  college: z.string().trim().min(2, "Please enter your college name.").max(200),
  department: z.string().trim().min(2, "Please enter your department or branch.").max(160),
  studyYear: z.enum(studyYearOptions),
  whatsapp: z.string().trim().min(7, "Please enter a valid WhatsApp number.").max(32),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  track: z.enum(trackOptions),
  tools: z.array(z.string().trim().min(1).max(100)).min(1, "Choose at least one capability.").max(6),
  focus: z.string().trim().min(2, "Choose the answer that fits you best.").max(220),
  portfolioLink: z.union([z.literal(""), z.string().url("Use a complete https:// link.").max(1000)]),
  goal: z.enum(goalOptions),
  workstation: z.enum(workstationOptions),
  consent: z.literal(true, { error: "Please confirm the consent statement before submitting." }),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export function isSafeRedirectUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
