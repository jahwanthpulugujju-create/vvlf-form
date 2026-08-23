import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 150 }).notNull(),
  college: varchar("college", { length: 200 }).notNull(),
  department: varchar("department", { length: 160 }).notNull(),
  studyYear: varchar("studyYear", { length: 40 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  track: varchar("track", { length: 80 }).notNull(),
  tools: text("tools").notNull(),
  focus: text("focus").notNull(),
  portfolioLink: varchar("portfolioLink", { length: 1000 }),
  goal: varchar("goal", { length: 180 }).notNull(),
  workstation: varchar("workstation", { length: 180 }).notNull(),
  consent: boolean("consent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const studioForms = mysqlTable("studioForms", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  successMessage: text("successMessage").notNull(),
  redirectUrl: varchar("redirectUrl", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudioForm = typeof studioForms.$inferSelect;
export type InsertStudioForm = typeof studioForms.$inferInsert;

export const studioQuestions = mysqlTable("studioQuestions", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  kind: mysqlEnum("kind", ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"]).notNull(),
  label: varchar("label", { length: 300 }).notNull(),
  helpText: text("helpText"),
  options: text("options"),
  required: boolean("required").default(false).notNull(),
  position: int("position").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudioQuestion = typeof studioQuestions.$inferSelect;
export type InsertStudioQuestion = typeof studioQuestions.$inferInsert;

export const studioResponses = mysqlTable("studioResponses", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  answers: text("answers").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudioResponse = typeof studioResponses.$inferSelect;
export type InsertStudioResponse = typeof studioResponses.$inferInsert;
