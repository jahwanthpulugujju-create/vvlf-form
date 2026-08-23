import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { applications, InsertApplication, InsertStudioForm, InsertStudioQuestion, InsertStudioResponse, InsertUser, studioForms, studioQuestions, studioResponses, users } from "../drizzle/schema";
import type { StudioFormInput } from "./formStudio";
import { nanoid } from "nanoid";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createApplication(application: InsertApplication): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Application storage is unavailable.");
  await db.insert(applications).values(application);
}

export async function listApplications() {
  const db = await getDb();
  if (!db) throw new Error("Application storage is unavailable.");
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

function makeStudioSlug(title: string) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "form";
  return `${base}-${nanoid(7).toLowerCase()}`;
}

function questionValues(formId: number, questions: StudioFormInput["questions"]): InsertStudioQuestion[] {
  return questions.map((question, index) => ({
    formId,
    kind: question.kind,
    label: question.label,
    helpText: question.helpText || null,
    options: question.options.length ? JSON.stringify(question.options) : null,
    required: question.required,
    position: index,
  }));
}

export async function listOwnedStudioForms(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  return db.select().from(studioForms).where(eq(studioForms.ownerId, ownerId)).orderBy(desc(studioForms.updatedAt));
}

export async function getOwnedStudioForm(ownerId: number, formId: number) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId))).limit(1);
  if (!forms[0]) return undefined;
  const questions = await db.select().from(studioQuestions).where(eq(studioQuestions.formId, formId)).orderBy(asc(studioQuestions.position));
  return { form: forms[0], questions };
}

export async function createOwnedStudioForm(ownerId: number, input: StudioFormInput) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const value: InsertStudioForm = {
    ownerId,
    title: input.title,
    slug: makeStudioSlug(input.title),
    description: input.description || null,
    status: "draft",
    successMessage: input.successMessage,
    redirectUrl: input.redirectUrl || null,
  };
  const inserted = await db.insert(studioForms).values(value);
  const formId = inserted[0].insertId;
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return formId;
}

export async function updateOwnedStudioForm(ownerId: number, formId: number, input: StudioFormInput) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const owned = await getOwnedStudioForm(ownerId, formId);
  if (!owned) return false;
  await db.update(studioForms).set({
    title: input.title,
    description: input.description || null,
    successMessage: input.successMessage,
    redirectUrl: input.redirectUrl || null,
  }).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId)));
  await db.delete(studioQuestions).where(eq(studioQuestions.formId, formId));
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return true;
}

export async function setStudioFormStatus(ownerId: number, formId: number, status: "draft" | "published") {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const result = await db.update(studioForms).set({ status }).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId)));
  return result[0].affectedRows > 0;
}

export async function getPublishedStudioForm(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where(and(eq(studioForms.slug, slug), eq(studioForms.status, "published"))).limit(1);
  if (!forms[0]) return undefined;
  const questions = await db.select().from(studioQuestions).where(eq(studioQuestions.formId, forms[0].id)).orderBy(asc(studioQuestions.position));
  return { form: forms[0], questions };
}

export async function createStudioResponse(response: InsertStudioResponse) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  await db.insert(studioResponses).values(response);
}

export async function listOwnedStudioResponses(ownerId: number, formId: number) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const owned = await getOwnedStudioForm(ownerId, formId);
  if (!owned) return undefined;
  const responses = await db.select().from(studioResponses).where(eq(studioResponses.formId, formId)).orderBy(desc(studioResponses.createdAt));
  return responses;
}
