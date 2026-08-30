import { z } from "zod";
import { recommendInternalRole, VVLF_INTERNAL_ROLES } from "@shared/roleRecommendation";

export const categoryOptions = [
  "Startups & Business",
  "Technology & Product",
  "Creative & Media",
  "Content & Community",
  "Explore & Build",
] as const;

export const studyYearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export const availabilityHoursOptions = [
  "5–8 hours",
  "8–12 hours",
  "12–20 hours",
  "20+ hours",
] as const;

export const availabilityDurationOptions = [
  "3 months",
  "6 months",
  "9 months",
  "12+ months",
] as const;

export const startTimelineOptions = [
  "Immediately",
  "Within 2 weeks",
  "Within 1 month",
  "Other",
] as const;

export const motivationOptions = [
  "Build real projects",
  "Learn new skills",
  "Work with startups",
  "Build my portfolio",
  "Meet founders and mentors",
  "Work on media/content",
  "Explore entrepreneurship",
  "Gain practical experience",
] as const;

export const applicationInputSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(150),
  college: z.string().trim().min(2, "Please enter your college name.").max(200),
  department: z.string().trim().min(2, "Please enter your department or branch.").max(160),
  studyYear: z.enum(studyYearOptions),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits (numbers only)."),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  
  // Category / Track selection
  category: z.string().trim().min(1, "Please select an interest category."),
  secondaryCategory: z.string().trim().optional(),
  
  // Detailed work areas and skills
  workAreas: z.array(z.string().trim()).default([]),
  skills: z.array(z.string().trim()).min(1, "Please select at least one skill or 'I’m still learning'."),
  
  // Proof of work
  proofOfWorkLink: z.string().trim().optional(),
  proofOfWorkLink2: z.string().trim().optional(),
  noWorkToShare: z.boolean().default(false),
  learningInterest: z.string().trim().max(300).optional(),
  
  // Availability
  availabilityHours: z.string().trim().default("8–12 hours"),
  availabilityDuration: z.string().trim().default("6 months"),
  startTimeline: z.string().trim().default("Immediately"),
  
  // Motivation & Contribution
  goals: z.array(z.string().trim()).default([]),
  contribution: z.string().trim().min(2, "Please tell us what you would like to contribute to VVLF.").max(300),
  
  // Consent
  consent: z.literal(true, { error: "Please confirm the consent statement before submitting." }),

  // Backward-compatible fields (optional in input, populated if missing)
  track: z.string().trim().optional(),
  tools: z.array(z.string().trim()).optional(),
  focus: z.string().trim().optional(),
  portfolioLink: z.string().trim().optional(),
  goal: z.string().trim().optional(),
  workstation: z.string().trim().optional(),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export function enrichApplicationData(input: ApplicationInput) {
  const category = input.category || input.track || "Explore & Build";
  const skills = input.skills && input.skills.length > 0 ? input.skills : (input.tools || ["I’m still learning"]);
  const workAreas = input.workAreas || [];
  const proofOfWorkLink = input.proofOfWorkLink || input.portfolioLink || "";

  const recommendedRole = recommendInternalRole({
    category,
    secondaryCategory: input.secondaryCategory,
    workAreas,
    skills,
    proofOfWorkLink,
    learningInterest: input.learningInterest,
  });

  return {
    ...input,
    category,
    track: category,
    skills,
    tools: skills,
    workAreas,
    focus: workAreas.length > 0 ? workAreas.join(", ") : (input.focus || "General exploration"),
    proofOfWorkLink,
    portfolioLink: proofOfWorkLink || null,
    availabilityHours: input.availabilityHours || "8–12 hours",
    availabilityDuration: input.availabilityDuration || "6 months",
    startTimeline: input.startTimeline || "Immediately",
    goals: input.goals || (input.goal ? [input.goal] : ["Build real projects"]),
    goal: input.goals && input.goals.length > 0 ? input.goals.join(", ") : (input.goal || "Build real projects"),
    workstation: input.workstation || input.availabilityHours || "Personal laptop",
    recommendedRole,
  };
}

export function isSafeRedirectUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
