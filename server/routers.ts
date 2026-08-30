import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { applicationInputSchema, enrichApplicationData } from "./application";
import { createApplication, createOwnedStudioForm, createStudioResponse, getOwnedStudioForm, getPublishedStudioForm, listApplications, listOwnedStudioForms, listOwnedStudioResponses, setStudioFormStatus, updateOwnedStudioForm } from "./db";
import { studioFormInputSchema, validateStudioResponse } from "./formStudio";
import { syncAllSheets } from "./googleSheets";
import { updateLocalCsvFile } from "./excelExport";
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  createAdminSession,
  findAdminByUsername,
  getAdminAccounts,
  getAdminCookieOptions,
  readAuditLog,
  resetRateLimit,
  verifyAdminSession,
  verifyPassword,
  writeAuditLog,
} from "./adminAuth";
import {
  enrichApplications,
  getOverviewStats,
  getTrendData,
  getTrackDistribution,
  getSourceBreakdown,
  getSkillFrequency,
  getYearDistribution,
  getBranchDistribution,
  getFunnelData,
  getScoreDistribution,
  getTopCandidates,
  getInterestCombos,
} from "./analytics";
import {
  getAllCandidateMeta,
  setCandidateMeta,
  CANDIDATE_STATUS_LABELS,
} from "./candidateMeta";
import type { CandidateStatus } from "./candidateMeta";
import { ENV } from "./_core/env";
import { parse as parseCookieHeader } from "cookie";

// ---------------------------------------------------------------------------
// Admin session helper
// ---------------------------------------------------------------------------

async function requireAdminSession(
  req: { headers: { cookie?: string } }
): Promise<{ username: string; role: string }> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session required" });
  const session = await verifyAdminSession(token);
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired. Please log in again." });
  return session;
}

// ---------------------------------------------------------------------------
// Public question helper
// ---------------------------------------------------------------------------

function publicQuestion(question: {
  id: number;
  kind: "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multiple_choice" | "consent";
  label: string;
  helpText: string | null;
  options: string | null;
  required: boolean;
  position: number;
}) {
  let options: string[] = [];
  try {
    options = question.options ? JSON.parse(question.options) : [];
  } catch {
    options = [];
  }
  return {
    id: question.id,
    kind: question.kind,
    label: question.label,
    helpText: question.helpText || "",
    options,
    required: question.required,
    position: question.position,
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const appRouter = router({
  system: systemRouter,

  // -------------------------------------------------------------------------
  // Existing auth (OAuth / session)
  // -------------------------------------------------------------------------
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // -------------------------------------------------------------------------
  // Admin authentication (username + password, separate from OAuth)
  // -------------------------------------------------------------------------
  admin: router({
    login: publicProcedure
      .input(z.object({ username: z.string().min(1).max(80), password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const ip = (ctx.req.headers["x-forwarded-for"] as string) ?? ctx.req.socket?.remoteAddress ?? "unknown";
        const rateCheck = checkRateLimit(ip);

        if (!rateCheck.allowed) {
          writeAuditLog({ adminUsername: input.username, action: "login_rate_limited", ip });
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many login attempts. Please wait 15 minutes before trying again.",
          });
        }

        const account = findAdminByUsername(input.username);
        if (!account) {
          writeAuditLog({ adminUsername: input.username, action: "login_failed_user_not_found", ip });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password." });
        }

        const passwordOk = await verifyPassword(input.password, account.passwordHash);
        if (!passwordOk) {
          writeAuditLog({ adminUsername: input.username, action: "login_failed_wrong_password", ip });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password." });
        }

        resetRateLimit(ip);
        const token = await createAdminSession(account.username, account.role);
        const cookieOptions = getAdminCookieOptions(ENV.isProduction);
        ctx.res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);
        writeAuditLog({ adminUsername: account.username, action: "login_success", ip });

        return { success: true, username: account.username, displayName: account.displayName, role: account.role } as const;
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const session = await verifyAdminSession(
        parseCookieHeader(ctx.req.headers.cookie ?? "")[ADMIN_COOKIE_NAME] ?? ""
      ).catch(() => null);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
      if (session) writeAuditLog({ adminUsername: session.username, action: "logout" });
      return { success: true } as const;
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = parseCookieHeader(ctx.req.headers.cookie ?? "")[ADMIN_COOKIE_NAME];
      if (!token) return null;
      const session = await verifyAdminSession(token).catch(() => null);
      if (!session) return null;
      const account = findAdminByUsername(session.username);
      if (!account) return null;
      return { username: account.username, displayName: account.displayName, role: account.role };
    }),

    // -----------------------------------------------------------------------
    // Applicant list with enrichment
    // -----------------------------------------------------------------------
    listApplications: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      const raw = await listApplications();
      const metaMap = getAllCandidateMeta();
      return enrichApplications(raw as Parameters<typeof enrichApplications>[0], metaMap);
    }),

    // -----------------------------------------------------------------------
    // Overview stats
    // -----------------------------------------------------------------------
    overviewStats: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      const raw = await listApplications();
      const metaMap = getAllCandidateMeta();
      const enriched = enrichApplications(raw as Parameters<typeof enrichApplications>[0], metaMap);
      return getOverviewStats(enriched);
    }),

    // -----------------------------------------------------------------------
    // Analytics data
    // -----------------------------------------------------------------------
    analyticsData: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      const raw = await listApplications();
      const metaMap = getAllCandidateMeta();
      const enriched = enrichApplications(raw as Parameters<typeof enrichApplications>[0], metaMap);
      return {
        trend: getTrendData(raw as Parameters<typeof getTrendData>[0]),
        trackDistribution: getTrackDistribution(enriched),
        sourceBreakdown: getSourceBreakdown(enriched),
        skillFrequency: getSkillFrequency(enriched),
        yearDistribution: getYearDistribution(raw as Parameters<typeof getYearDistribution>[0]),
        branchDistribution: getBranchDistribution(raw as Parameters<typeof getBranchDistribution>[0]),
        funnel: getFunnelData(raw as Parameters<typeof getFunnelData>[0]),
        scoreDistribution: getScoreDistribution(enriched),
        topCandidates: getTopCandidates(enriched, 50),
        interestCombos: getInterestCombos(enriched),
        overviewStats: getOverviewStats(enriched),
      };
    }),

    // -----------------------------------------------------------------------
    // Update candidate status / notes
    // -----------------------------------------------------------------------
    updateCandidate: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum([
          "new", "screening", "shortlisted", "challenge_sent",
          "challenge_done", "interview", "selected", "waitlisted", "rejected", "withdrawn"
        ]).optional(),
        notes: z.string().max(2000).optional(),
        scoreOverride: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await requireAdminSession(ctx.req);
        const meta = setCandidateMeta(input.id, {
          ...(input.status ? { status: input.status as CandidateStatus } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.scoreOverride !== undefined ? { scoreOverride: input.scoreOverride } : {}),
        }, session.username);
        writeAuditLog({
          adminUsername: session.username,
          action: "update_candidate",
          target: `candidate #${input.id}`,
          metadata: { status: input.status, hasNotes: Boolean(input.notes) },
        });
        return { success: true, meta };
      }),

    // -----------------------------------------------------------------------
    // Audit log
    // -----------------------------------------------------------------------
    auditLog: publicProcedure
      .input(z.object({ limit: z.number().int().positive().max(500).default(100) }))
      .query(async ({ input, ctx }) => {
        const session = await requireAdminSession(ctx.req);
        if (session.role === "reviewer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Reviewers cannot access the audit log." });
        }
        return readAuditLog(input.limit);
      }),

    // -----------------------------------------------------------------------
    // Admin accounts list (owners only)
    // -----------------------------------------------------------------------
    listAdminAccounts: publicProcedure.query(async ({ ctx }) => {
      const session = await requireAdminSession(ctx.req);
      if (session.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can view admin accounts." });
      }
      return getAdminAccounts().map((a) => ({
        username: a.username,
        displayName: a.displayName,
        role: a.role,
        active: a.active,
      }));
    }),

    statusLabels: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      return CANDIDATE_STATUS_LABELS;
    }),
  }),

  // -------------------------------------------------------------------------
  // Existing application routes
  // -------------------------------------------------------------------------
  application: router({
    submit: publicProcedure.input(applicationInputSchema).mutation(async ({ input }) => {
      try {
        const enriched = enrichApplicationData(input);

        await createApplication({
          fullName: enriched.fullName,
          college: enriched.college,
          department: enriched.department,
          studyYear: enriched.studyYear,
          whatsapp: enriched.whatsapp,
          email: enriched.email,
          track: enriched.category,
          tools: JSON.stringify({
            category: enriched.category,
            secondaryCategory: enriched.secondaryCategory,
            workAreas: enriched.workAreas,
            skills: enriched.skills,
            recommendedRole: enriched.recommendedRole,
            learningInterest: enriched.learningInterest,
            availabilityHours: enriched.availabilityHours,
            availabilityDuration: enriched.availabilityDuration,
            noWorkToShare: enriched.noWorkToShare,
          }),
          focus: enriched.focus,
          portfolioLink: enriched.portfolioLink,
          goal: enriched.goal,
          workstation: enriched.workstation,
          consent: enriched.consent,
          source: enriched.source,
        });

        try {
          await syncAllSheets({
            fullName: enriched.fullName,
            college: enriched.college,
            department: enriched.department,
            studyYear: enriched.studyYear,
            whatsapp: enriched.whatsapp,
            email: enriched.email,
            category: enriched.category,
            secondaryCategory: enriched.secondaryCategory,
            track: enriched.category,
            workAreas: enriched.workAreas,
            skills: enriched.skills,
            tools: enriched.skills,
            focus: enriched.focus,
            proofOfWorkLink: enriched.proofOfWorkLink,
            proofOfWorkLink2: enriched.proofOfWorkLink2,
            portfolioLink: enriched.portfolioLink,
            noWorkToShare: enriched.noWorkToShare,
            learningInterest: enriched.learningInterest,
            availabilityHours: enriched.availabilityHours,
            availabilityDuration: enriched.availabilityDuration,
            startTimeline: enriched.startTimeline,
            goals: enriched.goals,
            goal: enriched.goal,
            contribution: enriched.contribution,
            workstation: enriched.workstation,
            recommendedRole: enriched.recommendedRole,
            consent: enriched.consent,
          });
        } catch (sheetsErr) {
          console.error("[Sheets Sync] Error:", sheetsErr);
        }

        updateLocalCsvFile().catch(() => {});

        return {
          success: true,
          recommendedRole: enriched.recommendedRole,
        } as const;
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

  // -------------------------------------------------------------------------
  // Existing studio routes
  // -------------------------------------------------------------------------
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
