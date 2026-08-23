import { z } from "zod";

export const studioQuestionKinds = ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"] as const;
export type StudioQuestionKind = (typeof studioQuestionKinds)[number];

export const studioQuestionInputSchema = z.object({
  kind: z.enum(studioQuestionKinds),
  label: z.string().trim().min(1, "Every question needs a label.").max(300),
  helpText: z.string().trim().max(1000).optional().default(""),
  options: z.array(z.string().trim().min(1).max(160)).max(25).optional().default([]),
  required: z.boolean().default(false),
  position: z.number().int().min(0),
});

export const studioFormInputSchema = z.object({
  title: z.string().trim().min(2, "Give your form a title.").max(180),
  description: z.string().trim().max(3000).optional().default(""),
  successMessage: z.string().trim().min(2, "Add a short confirmation message.").max(3000),
  redirectUrl: z.string().trim().max(1000).optional().default(""),
  questions: z.array(studioQuestionInputSchema).min(1, "Add at least one question."),
});

export type StudioQuestionInput = z.infer<typeof studioQuestionInputSchema>;
export type StudioFormInput = z.infer<typeof studioFormInputSchema>;

export type PublicStudioQuestion = StudioQuestionInput & { id: number };

const isBlank = (value: unknown) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

export function validateStudioResponse(questions: PublicStudioQuestion[], rawAnswers: Record<string, unknown>) {
  const answers: Record<string, unknown> = {};

  for (const question of questions) {
    const key = String(question.id);
    const rawValue = rawAnswers[key];

    if (question.required && isBlank(rawValue)) {
      throw new Error(`Please answer: ${question.label}`);
    }
    if (isBlank(rawValue)) continue;

    if (question.kind === "consent") {
      if (rawValue !== true) throw new Error(`Please confirm: ${question.label}`);
      answers[key] = true;
      continue;
    }

    if (question.kind === "multiple_choice") {
      if (!Array.isArray(rawValue) || rawValue.some((option) => typeof option !== "string" || !question.options.includes(option))) {
        throw new Error(`Choose valid options for: ${question.label}`);
      }
      answers[key] = rawValue;
      continue;
    }

    if (typeof rawValue !== "string") throw new Error(`Enter a valid answer for: ${question.label}`);
    const value = rawValue.trim();
    if (question.kind === "email" && !/^\S+@\S+\.\S+$/.test(value)) throw new Error(`Enter a valid email for: ${question.label}`);
    if (question.kind === "single_choice" && !question.options.includes(value)) throw new Error(`Choose a valid option for: ${question.label}`);
    answers[key] = value;
  }

  return answers;
}
