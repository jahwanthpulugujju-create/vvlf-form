import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  applications,
  InsertApplication,
  InsertStudioForm,
  InsertStudioQuestion,
  InsertStudioResponse,
  InsertUser,
  studioForms,
  studioQuestions,
  studioResponses,
  users,
} from "../drizzle/schema";
import type { StudioFormInput } from "./formStudio";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _client = null;
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("User storage is unavailable.");

  const ownerRole = user.openId === ENV.ownerOpenId ? "admin" : undefined;
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? ownerRole ?? "user",
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      role: values.role,
      lastSignedIn: values.lastSignedIn,
      updatedAt: new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

import fs from "fs";
import path from "path";

const LOCAL_STORE_PATH = path.resolve(import.meta.dirname, "../data/applications_store.json");

function ensureLocalStoreDir() {
  const dir = path.dirname(LOCAL_STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalApplications(): (InsertApplication & { id: number; createdAt: Date })[] {
  try {
    ensureLocalStoreDir();
    if (!fs.existsSync(LOCAL_STORE_PATH)) return [];
    const content = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeLocalApplication(app: InsertApplication) {
  ensureLocalStoreDir();
  const list = readLocalApplications();
  const newEntry = {
    ...app,
    id: list.length + 1,
    createdAt: new Date(),
  };
  list.unshift(newEntry);
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(list, null, 2), "utf-8");
}

export async function createApplication(application: InsertApplication): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.insert(applications).values(application);
  } else {
    console.log("[LocalStore] Storing application locally in data/applications_store.json");
    writeLocalApplication(application);
  }
}

export async function listApplications() {
  const db = await getDb();
  if (db) {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  }
  return readLocalApplications();
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
  const [created] = await db.insert(studioForms).values(value).returning({ id: studioForms.id });
  if (!created) throw new Error("Form Studio form could not be created.");
  await db.insert(studioQuestions).values(questionValues(created.id, input.questions));
  return created.id;
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
    updatedAt: new Date(),
  }).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId)));
  await db.delete(studioQuestions).where(eq(studioQuestions.formId, formId));
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return true;
}

export async function setStudioFormStatus(ownerId: number, formId: number, status: "draft" | "published") {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const updated = await db.update(studioForms).set({ status, updatedAt: new Date() })
    .where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId))).returning({ id: studioForms.id });
  return updated.length > 0;
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
  return db.select().from(studioResponses).where(eq(studioResponses.formId, formId)).orderBy(desc(studioResponses.createdAt));
}
