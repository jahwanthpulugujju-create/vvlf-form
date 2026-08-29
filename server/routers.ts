import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { applicationInputSchema } from "./application";
import { createApplication, createOwnedStudioForm, createStudioResponse, getOwnedStudioForm, getPublishedStudioForm, listApplications, listOwnedStudioForms, listOwnedStudioResponses, setStudioFormStatus, updateOwnedStudioForm } from "./db";
import { studioFormInputSchema, validateStudioResponse } from "./formStudio";
import { syncAllSheets } from "./googleSheets";
import { updateLocalCsvFile } from "./excelExport";

function publicQuestion(question: { id: number; kind: "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multiple_choice" | "consent"; label: string; helpText: string | null; options: string | null; required: boolean; position: number }) {
  let options: string[] = [];
  try {
    options = question.options ? JSON.parse(question.options) : [];
  } catch {
    options = [];
  }
  return { id: question.id, kind: question.kind, label: question.label, helpText: question.helpText || "", options, required: question.required, position: question.position };
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  application: router({
    submit: publicProcedure.input(applicationInputSchema).mutation(async ({ input }) => {
      try {
        await createApplication({
          fullName: input.fullName,
          college: input.college,
          department: input.department,
          studyYear: input.studyYear,
          whatsapp: input.whatsapp,
          email: input.email,
          track: input.track,
          tools: JSON.stringify(input.tools),
          focus: input.focus,
          portfolioLink: input.portfolioLink || null,
          goal: input.goal,
          workstation: input.workstation,
          consent: input.consent,
        });

        // Trigger real-time sync to Google Sheets and Excel Online (awaited for serverless resilience)
        try {
          await syncAllSheets({
            fullName: input.fullName,
            college: input.college,
            department: input.department,
            studyYear: input.studyYear,
            whatsapp: input.whatsapp,
            email: input.email,
            track: input.track,
            tools: input.tools,
            focus: input.focus,
            portfolioLink: input.portfolioLink,
            goal: input.goal,
            workstation: input.workstation,
            consent: input.consent,
          });
        } catch (sheetsErr) {
          console.error("[Sheets Sync] Error:", sheetsErr);
        }

        // Update local spreadsheet file
        updateLocalCsvFile().catch(() => {});

        return { success: true } as const;
      } catch (error) {
        console.error("[Application] Submission failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not save your application. Please try again in a moment.",
        });
      }
    }),
    list: adminProcedure.query(async () => {
      try {
        return await listApplications();
      } catch (error) {
        console.error("[Application] Listing failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not load applications. Please try again in a moment.",
        });
      }
    }),
  }),
  studio: router({
    list: protectedProcedure.query(async ({ ctx }) => listOwnedStudioForms(ctx.user.id)),
    get: protectedProcedure.input(z.object({ formId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const result = await getOwnedStudioForm(ctx.user.id, input.formId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    create: protectedProcedure.input(studioFormInputSchema).mutation(async ({ ctx, input }) => {
      const formId = await createOwnedStudioForm(ctx.user.id, input);
      return { formId };
    }),
    update: protectedProcedure.input(z.object({ formId: z.number().int().positive(), data: studioFormInputSchema })).mutation(async ({ ctx, input }) => {
      const updated = await updateOwnedStudioForm(ctx.user.id, input.formId, input.data);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true } as const;
    }),
    setStatus: protectedProcedure.input(z.object({ formId: z.number().int().positive(), status: z.enum(["draft", "published"]) })).mutation(async ({ ctx, input }) => {
      const updated = await setStudioFormStatus(ctx.user.id, input.formId, input.status);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true } as const;
    }),
    responses: protectedProcedure.input(z.object({ formId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const responses = await listOwnedStudioResponses(ctx.user.id, input.formId);
      if (!responses) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return responses;
    }),
    publicGet: publicProcedure.input(z.object({ slug: z.string().min(1).max(140) })).query(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "This form is unavailable." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    submit: publicProcedure.input(z.object({ slug: z.string().min(1).max(140), answers: z.record(z.string(), z.unknown()) })).mutation(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "This form is unavailable." });
      try {
        const answers = validateStudioResponse(result.questions.map(publicQuestion), input.answers);
        await createStudioResponse({ formId: result.form.id, answers: JSON.stringify(answers) });
        return { success: true, redirectUrl: result.form.redirectUrl } as const;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Please review your answers." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
