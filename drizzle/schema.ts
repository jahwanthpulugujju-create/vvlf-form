import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const studioFormStatus = pgEnum("studio_form_status", ["draft", "published"]);
export const studioQuestionKind = pgEnum("studio_question_kind", ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  college: varchar("college", { length: 200 }).notNull(),
  department: varchar("department", { length: 160 }).notNull(),
  studyYear: varchar("study_year", { length: 40 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  track: varchar("track", { length: 80 }).notNull(),
  tools: text("tools").notNull(),
  focus: text("focus").notNull(),
  portfolioLink: varchar("portfolio_link", { length: 1000 }),
  goal: varchar("goal", { length: 180 }).notNull(),
  workstation: varchar("workstation", { length: 180 }).notNull(),
  consent: boolean("consent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const studioForms = pgTable("studio_forms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  status: studioFormStatus("status").default("draft").notNull(),
  successMessage: text("success_message").notNull(),
  redirectUrl: varchar("redirect_url", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StudioForm = typeof studioForms.$inferSelect;
export type InsertStudioForm = typeof studioForms.$inferInsert;

export const studioQuestions = pgTable("studio_questions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => studioForms.id, { onDelete: "cascade" }),
  kind: studioQuestionKind("kind").notNull(),
  label: varchar("label", { length: 300 }).notNull(),
  helpText: text("help_text"),
  options: text("options"),
  required: boolean("required").default(false).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StudioQuestion = typeof studioQuestions.$inferSelect;
export type InsertStudioQuestion = typeof studioQuestions.$inferInsert;

export const studioResponses = pgTable("studio_responses", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => studioForms.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StudioResponse = typeof studioResponses.$inferSelect;
export type InsertStudioResponse = typeof studioResponses.$inferInsert;
