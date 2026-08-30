// api/handler.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
var userRole = pgEnum("user_role", ["user", "admin"]);
var studioFormStatus = pgEnum("studio_form_status", ["draft", "published"]);
var studioQuestionKind = pgEnum("studio_question_kind", ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull()
});
var applications = pgTable("applications", {
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
  portfolioLink: varchar("portfolio_link", { length: 1e3 }),
  goal: varchar("goal", { length: 180 }).notNull(),
  workstation: varchar("workstation", { length: 180 }).notNull(),
  consent: boolean("consent").notNull(),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var studioForms = pgTable("studio_forms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  status: studioFormStatus("status").default("draft").notNull(),
  successMessage: text("success_message").notNull(),
  redirectUrl: varchar("redirect_url", { length: 1e3 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var studioQuestions = pgTable("studio_questions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => studioForms.id, { onDelete: "cascade" }),
  kind: studioQuestionKind("kind").notNull(),
  label: varchar("label", { length: 300 }).notNull(),
  helpText: text("help_text"),
  options: text("options"),
  required: boolean("required").default(false).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var studioResponses = pgTable("studio_responses", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => studioForms.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// server/db.ts
import { nanoid } from "nanoid";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Admin auth
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME ?? "Admin"
};

// server/db.ts
import fs from "fs";
import path from "path";
import os from "os";
var _client = null;
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("User storage is unavailable.");
  const ownerRole = user.openId === ENV.ownerOpenId ? "admin" : void 0;
  const values = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? ownerRole ?? "user",
    lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date()
  };
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      role: values.role,
      lastSignedIn: values.lastSignedIn,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
var inMemoryStore = [];
function getLocalStorePath() {
  try {
    const defaultPath = path.resolve(import.meta.dirname, "../data/applications_store.json");
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vvlf-data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
    }
    return path.join(tmpDir, "applications_store.json");
  }
}
function readLocalApplications() {
  try {
    const storePath = getLocalStorePath();
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, "utf-8");
      const parsed = JSON.parse(content);
      return [...inMemoryStore, ...parsed];
    }
  } catch (err) {
    console.warn("[LocalStore] File read error:", err);
  }
  return inMemoryStore;
}
function writeLocalApplication(app2) {
  const newEntry = {
    ...app2,
    id: inMemoryStore.length + 1,
    createdAt: /* @__PURE__ */ new Date()
  };
  try {
    const storePath = getLocalStorePath();
    let list = [];
    if (fs.existsSync(storePath)) {
      try {
        list = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      } catch {
      }
    }
    newEntry.id = list.length + 1;
    list.unshift(newEntry);
    fs.writeFileSync(storePath, JSON.stringify(list, null, 2), "utf-8");
    console.log(`[LocalStore] Saved application #${newEntry.id} to ${storePath}`);
  } catch (err) {
    console.warn("[LocalStore] Read-only filesystem detected, keeping in memory store:", err);
    inMemoryStore.unshift(newEntry);
  }
}
async function createApplication(application) {
  try {
    const db = await getDb();
    if (db) {
      try {
        await db.insert(applications).values(application);
      } catch (colErr) {
        const msg = colErr instanceof Error ? colErr.message : String(colErr);
        if (msg.includes("source")) {
          const { source: _src, ...rest } = application;
          await db.insert(applications).values(rest);
        } else {
          throw colErr;
        }
      }
      return;
    }
  } catch (dbError) {
    console.warn("[Database] Database unavailable, falling back to local/memory store:", dbError);
  }
  writeLocalApplication(application);
}
async function listApplications() {
  try {
    const db = await getDb();
    if (db) {
      return await db.select().from(applications).orderBy(desc(applications.createdAt));
    }
  } catch (dbError) {
    console.warn("[Database] Query failed, falling back to local list:", dbError);
  }
  return readLocalApplications();
}
function makeStudioSlug(title) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "form";
  return `${base}-${nanoid(7).toLowerCase()}`;
}
function questionValues(formId, questions) {
  return questions.map((question, index) => ({
    formId,
    kind: question.kind,
    label: question.label,
    helpText: question.helpText || null,
    options: question.options.length ? JSON.stringify(question.options) : null,
    required: question.required,
    position: index
  }));
}
async function listOwnedStudioForms(ownerId) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  return db.select().from(studioForms).where(eq(studioForms.ownerId, ownerId)).orderBy(desc(studioForms.updatedAt));
}
async function getOwnedStudioForm(ownerId, formId) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId))).limit(1);
  if (!forms[0]) return void 0;
  const questions = await db.select().from(studioQuestions).where(eq(studioQuestions.formId, formId)).orderBy(asc(studioQuestions.position));
  return { form: forms[0], questions };
}
async function createOwnedStudioForm(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const value = {
    ownerId,
    title: input.title,
    slug: makeStudioSlug(input.title),
    description: input.description || null,
    status: "draft",
    successMessage: input.successMessage,
    redirectUrl: input.redirectUrl || null
  };
  const [created] = await db.insert(studioForms).values(value).returning({ id: studioForms.id });
  if (!created) throw new Error("Form Studio form could not be created.");
  await db.insert(studioQuestions).values(questionValues(created.id, input.questions));
  return created.id;
}
async function updateOwnedStudioForm(ownerId, formId, input) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const owned = await getOwnedStudioForm(ownerId, formId);
  if (!owned) return false;
  await db.update(studioForms).set({
    title: input.title,
    description: input.description || null,
    successMessage: input.successMessage,
    redirectUrl: input.redirectUrl || null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId)));
  await db.delete(studioQuestions).where(eq(studioQuestions.formId, formId));
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return true;
}
async function setStudioFormStatus(ownerId, formId, status) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const updated = await db.update(studioForms).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(studioForms.id, formId), eq(studioForms.ownerId, ownerId))).returning({ id: studioForms.id });
  return updated.length > 0;
}
async function getPublishedStudioForm(slug) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where(and(eq(studioForms.slug, slug), eq(studioForms.status, "published"))).limit(1);
  if (!forms[0]) return void 0;
  const questions = await db.select().from(studioQuestions).where(eq(studioQuestions.formId, forms[0].id)).orderBy(asc(studioQuestions.position));
  return { form: forms[0], questions };
}
async function createStudioResponse(response) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  await db.insert(studioResponses).values(response);
}
async function listOwnedStudioResponses(ownerId, formId) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const owned = await getOwnedStudioForm(ownerId, formId);
  if (!owned) return void 0;
  return db.select().from(studioResponses).where(eq(studioResponses.formId, formId)).orderBy(desc(studioResponses.createdAt));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
import fs2 from "fs";
import path2 from "path";
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    const localCandidates = [
      path2.resolve(import.meta.dirname, "../../client/public/manus-storage", key),
      path2.resolve(import.meta.dirname, "../../dist/public/manus-storage", key)
    ];
    for (const localPath of localCandidates) {
      if (fs2.existsSync(localPath)) {
        res.sendFile(localPath);
        return;
      }
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Storage file not found");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z4 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/application.ts
import { z as z2 } from "zod";

// shared/roleRecommendation.ts
function recommendInternalRole(input) {
  const { category, workAreas = [], skills = [] } = input;
  const combinedText = [...workAreas, ...skills].join(" ").toLowerCase();
  switch (category) {
    case "Technology & Product": {
      if (combinedText.includes("ai") || combinedText.includes("llm") || combinedText.includes("automation") || combinedText.includes("python")) {
        return "AI & Automation Engineering Intern";
      }
      return "Digital Product & Full-Stack Engineering Intern";
    }
    case "Creative & Media": {
      if (combinedText.includes("motion graphics") || combinedText.includes("after effects") || combinedText.includes("video editing") || combinedText.includes("premiere") || combinedText.includes("davinci")) {
        return "Video, Motion & Post-Production Intern";
      }
      if (combinedText.includes("photography") || combinedText.includes("cinematic") || combinedText.includes("audio") || combinedText.includes("camera")) {
        return "Cinematic Media Production Intern";
      }
      return "Creative Brand & Visual Communications Intern";
    }
    case "Startups & Business": {
      if (combinedText.includes("commercial") || combinedText.includes("institutional") || combinedText.includes("sponsorship") || combinedText.includes("business development")) {
        return "Commercial & Institutional Partnerships Intern";
      }
      if (combinedText.includes("partnerships") || combinedText.includes("ecosystem") || combinedText.includes("events") || combinedText.includes("networking")) {
        return "Strategic Partnerships & Ecosystem Intern";
      }
      if (combinedText.includes("market research") || combinedText.includes("startup research") || combinedText.includes("competitive research")) {
        return "Venture Scouting & Market Research Intern";
      }
      return "Venture Intelligence & Strategy Intern";
    }
    case "Content & Community": {
      if (combinedText.includes("social media") || combinedText.includes("instagram") || combinedText.includes("short-form") || combinedText.includes("reels")) {
        return "Short-Form & Social Media Growth Intern";
      }
      if (combinedText.includes("community") || combinedText.includes("founder success") || combinedText.includes("peer outreach")) {
        return "Founder Success & Community Intern";
      }
      return "Content, Growth & Distribution Intern";
    }
    case "Explore & Build": {
      if (combinedText.includes("technology") || combinedText.includes("coding") || combinedText.includes("ai")) {
        return "Digital Product & Full-Stack Engineering Intern";
      }
      if (combinedText.includes("design") || combinedText.includes("video") || combinedText.includes("media")) {
        return "Creative Brand & Visual Communications Intern";
      }
      if (combinedText.includes("startups") || combinedText.includes("business") || combinedText.includes("research")) {
        return "Venture Scouting & Market Research Intern";
      }
      if (combinedText.includes("content") || combinedText.includes("social") || combinedText.includes("community")) {
        return "Founder Success & Community Intern";
      }
      return "Founder Success & Community Intern";
    }
    default:
      return "Founder Success & Community Intern";
  }
}

// server/application.ts
var studyYearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
var applicationInputSchema = z2.object({
  fullName: z2.string().trim().min(2, "Please enter your full name.").max(150),
  college: z2.string().trim().min(2, "Please enter your college name.").max(200),
  department: z2.string().trim().min(2, "Please enter your department or branch.").max(160),
  studyYear: z2.enum(studyYearOptions),
  whatsapp: z2.string().trim().regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits (numbers only)."),
  email: z2.string().trim().email("Please enter a valid email address.").max(320),
  // Category / Track selection
  category: z2.string().trim().min(1, "Please select an interest category."),
  secondaryCategory: z2.string().trim().optional(),
  // Detailed work areas and skills
  workAreas: z2.array(z2.string().trim()).default([]),
  skills: z2.array(z2.string().trim()).min(1, "Please select at least one skill or 'I\u2019m still learning'."),
  // Proof of work
  proofOfWorkLink: z2.string().trim().optional(),
  proofOfWorkLink2: z2.string().trim().optional(),
  noWorkToShare: z2.boolean().default(false),
  learningInterest: z2.string().trim().max(300).optional(),
  // Availability
  availabilityHours: z2.string().trim().default("8\u201312 hours"),
  availabilityDuration: z2.string().trim().default("6 months"),
  startTimeline: z2.string().trim().default("Immediately"),
  // Motivation & Contribution
  goals: z2.array(z2.string().trim()).default([]),
  contribution: z2.string().trim().min(2, "Please tell us what you would like to contribute to VVLF.").max(300),
  // Consent
  consent: z2.literal(true, { error: "Please confirm the consent statement before submitting." }),
  // Acquisition source (from ?source= URL param)
  source: z2.string().trim().max(100).optional(),
  // Backward-compatible fields (optional in input, populated if missing)
  track: z2.string().trim().optional(),
  tools: z2.array(z2.string().trim()).optional(),
  focus: z2.string().trim().optional(),
  portfolioLink: z2.string().trim().optional(),
  goal: z2.string().trim().optional(),
  workstation: z2.string().trim().optional()
});
function enrichApplicationData(input) {
  const category = input.category || input.track || "Explore & Build";
  const skills = input.skills && input.skills.length > 0 ? input.skills : input.tools || ["I\u2019m still learning"];
  const workAreas = input.workAreas || [];
  const proofOfWorkLink = input.proofOfWorkLink || input.portfolioLink || "";
  const recommendedRole = recommendInternalRole({
    category,
    secondaryCategory: input.secondaryCategory,
    workAreas,
    skills,
    proofOfWorkLink,
    learningInterest: input.learningInterest
  });
  return {
    ...input,
    category,
    track: category,
    skills,
    tools: skills,
    workAreas,
    focus: workAreas.length > 0 ? workAreas.join(", ") : input.focus || "General exploration",
    proofOfWorkLink,
    portfolioLink: proofOfWorkLink || null,
    availabilityHours: input.availabilityHours || "8\u201312 hours",
    availabilityDuration: input.availabilityDuration || "6 months",
    startTimeline: input.startTimeline || "Immediately",
    goals: input.goals || (input.goal ? [input.goal] : ["Build real projects"]),
    goal: input.goals && input.goals.length > 0 ? input.goals.join(", ") : input.goal || "Build real projects",
    workstation: input.workstation || input.availabilityHours || "Personal laptop",
    recommendedRole,
    source: input.source || null
  };
}

// server/formStudio.ts
import { z as z3 } from "zod";
var studioQuestionKinds = ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"];
var studioQuestionInputSchema = z3.object({
  kind: z3.enum(studioQuestionKinds),
  label: z3.string().trim().min(1, "Every question needs a label.").max(300),
  helpText: z3.string().trim().max(1e3).optional().default(""),
  options: z3.array(z3.string().trim().min(1).max(160)).max(25).optional().default([]),
  required: z3.boolean().default(false),
  position: z3.number().int().min(0)
});
var studioFormInputSchema = z3.object({
  title: z3.string().trim().min(2, "Give your form a title.").max(180),
  description: z3.string().trim().max(3e3).optional().default(""),
  successMessage: z3.string().trim().min(2, "Add a short confirmation message.").max(3e3),
  redirectUrl: z3.string().trim().max(1e3).optional().default(""),
  questions: z3.array(studioQuestionInputSchema).min(1, "Add at least one question.")
});
var isBlank = (value) => value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0;
function validateStudioResponse(questions, rawAnswers) {
  const answers = {};
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

// server/googleSheets.ts
var DEFAULT_GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz94rbvo1Lg83JM2gdLBOKoIf9pfhcaNH9fWHp4WD8v_8YmEWix4-hZr9jXZSZY5VJy/exec";
async function syncToGoogleSheets(data) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return { success: false, error: "GOOGLE_SHEET_WEBHOOK_URL is not configured" };
  }
  try {
    const toolsArray = data.skills || data.tools || [];
    const workAreasArray = data.workAreas || [];
    const goalsArray = data.goals || (data.goal ? [data.goal] : []);
    const payload = {
      ...data,
      category: data.category || data.track || "",
      track: data.category || data.track || "",
      secondaryCategory: data.secondaryCategory || "",
      workAreas: workAreasArray,
      workAreasFormatted: workAreasArray.join(", "),
      skills: toolsArray,
      tools: toolsArray,
      toolsFormatted: toolsArray.join(", "),
      proofOfWorkLink: data.proofOfWorkLink || data.portfolioLink || "",
      proofOfWorkLink2: data.proofOfWorkLink2 || "",
      portfolioLink: data.proofOfWorkLink || data.portfolioLink || "",
      availabilityHours: data.availabilityHours || "8\u201312 hours",
      availabilityDuration: data.availabilityDuration || "6 months",
      startTimeline: data.startTimeline || "Immediately",
      goalsFormatted: goalsArray.join(", "),
      goal: goalsArray.join(", "),
      contribution: data.contribution || "",
      recommendedRole: data.recommendedRole || "VVLF Student Builder",
      submittedAt: data.submittedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log(`[Google Sheets] Sending submission for "${data.fullName}" (${payload.recommendedRole}) to Google Sheet...`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    if (!response.ok && response.status !== 302) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Google Sheets] Webhook responded with HTTP ${response.status}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    console.log(`[Google Sheets] Successfully synced submission for "${data.fullName}" to Google Sheet!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Google Sheets] Sync failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
async function syncToExcelOnline(data) {
  const excelWebhookUrl = process.env.EXCEL_WEBHOOK_URL || process.env.MICROSOFT_POWER_AUTOMATE_URL;
  if (!excelWebhookUrl || !excelWebhookUrl.startsWith("http")) {
    return { success: false, error: "EXCEL_WEBHOOK_URL is not configured in .env" };
  }
  try {
    const toolsArray = data.skills || data.tools || [];
    const workAreasArray = data.workAreas || [];
    const goalsArray = data.goals || (data.goal ? [data.goal] : []);
    const payload = {
      submittedAt: data.submittedAt || (/* @__PURE__ */ new Date()).toISOString(),
      fullName: data.fullName,
      college: data.college,
      department: data.department,
      studyYear: data.studyYear,
      whatsapp: data.whatsapp,
      email: data.email,
      category: data.category || data.track || "",
      secondaryCategory: data.secondaryCategory || "N/A",
      workAreas: workAreasArray.join(", "),
      skills: toolsArray.join(", "),
      proofOfWorkLink: data.proofOfWorkLink || data.portfolioLink || "N/A",
      proofOfWorkLink2: data.proofOfWorkLink2 || "N/A",
      availabilityHours: data.availabilityHours || "8\u201312 hours",
      availabilityDuration: data.availabilityDuration || "6 months",
      startTimeline: data.startTimeline || "Immediately",
      goals: goalsArray.join(", "),
      contribution: data.contribution || "N/A",
      recommendedRole: data.recommendedRole || "N/A",
      consent: data.consent ? "Yes" : "No"
    };
    console.log(`[Excel Online] Sending submission for "${data.fullName}" to OneDrive Excel...`);
    const response = await fetch(excelWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Excel Online] Webhook error HTTP ${response.status}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    console.log(`[Excel Online] Successfully synced submission for "${data.fullName}" to OneDrive Excel!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Excel Online] Sync failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
async function syncAllSheets(data) {
  const results = await Promise.allSettled([
    syncToGoogleSheets(data),
    syncToExcelOnline(data)
  ]);
  return results;
}

// server/excelExport.ts
import fs3 from "fs";
import path3 from "path";
import os2 from "os";
function getCsvFilePath() {
  try {
    const defaultPath = path3.resolve(import.meta.dirname, "../data/VVLF_Student_Applications.csv");
    const dir = path3.dirname(defaultPath);
    if (!fs3.existsSync(dir)) {
      fs3.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  } catch {
    return path3.join(os2.tmpdir(), "VVLF_Student_Applications.csv");
  }
}
function escapeCsvField(value) {
  if (value === null || value === void 0) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
async function generateCsvString() {
  const applications2 = await listApplications();
  const headers = [
    "ID",
    "Submission Date (IST)",
    "Full Name",
    "College / University",
    "Department / Branch",
    "Current Year",
    "WhatsApp Number",
    "Email Address",
    "Primary Category",
    "Secondary Category",
    "Work Areas",
    "Skills & Capabilities",
    "Proof of Work / Link 1",
    "Proof of Work / Link 2",
    "Availability Hours",
    "Goals",
    "Contribution Note",
    "Recommended Internal Role",
    "Consent Confirmed"
  ];
  const rows = [headers.join(",")];
  for (const app2 of applications2) {
    let toolsText = "";
    let secondaryCategory = "";
    let workAreas = "";
    let recommendedRole = "";
    let learningInterest = "";
    try {
      const parsed = JSON.parse(app2.tools || "{}");
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        toolsText = Array.isArray(parsed.skills) ? parsed.skills.join(", ") : "";
        secondaryCategory = parsed.secondaryCategory || "";
        workAreas = Array.isArray(parsed.workAreas) ? parsed.workAreas.join(", ") : "";
        recommendedRole = parsed.recommendedRole || "";
        learningInterest = parsed.learningInterest || "";
      } else if (Array.isArray(parsed)) {
        toolsText = parsed.join(", ");
      } else {
        toolsText = String(parsed);
      }
    } catch {
      toolsText = app2.tools || "";
    }
    const dateStr = app2.createdAt ? new Date(app2.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";
    const row = [
      escapeCsvField(app2.id),
      escapeCsvField(dateStr),
      escapeCsvField(app2.fullName),
      escapeCsvField(app2.college),
      escapeCsvField(app2.department),
      escapeCsvField(app2.studyYear),
      escapeCsvField(app2.whatsapp),
      escapeCsvField(app2.email),
      escapeCsvField(app2.track),
      escapeCsvField(secondaryCategory || "N/A"),
      escapeCsvField(workAreas || app2.focus),
      escapeCsvField(toolsText),
      escapeCsvField(app2.portfolioLink || "N/A"),
      escapeCsvField("N/A"),
      escapeCsvField(app2.workstation || "8\u201312 hours"),
      escapeCsvField(app2.goal),
      escapeCsvField(learningInterest || "N/A"),
      escapeCsvField(recommendedRole || "VVLF Student Builder"),
      escapeCsvField(app2.consent ? "Yes" : "No")
    ];
    rows.push(row.join(","));
  }
  return rows.join("\r\n");
}
async function updateLocalCsvFile() {
  try {
    const csvFilePath = getCsvFilePath();
    const csvContent = await generateCsvString();
    const dir = path3.dirname(csvFilePath);
    if (!fs3.existsSync(dir)) {
      fs3.mkdirSync(dir, { recursive: true });
    }
    fs3.writeFileSync(csvFilePath, "\uFEFF" + csvContent, "utf-8");
    console.log(`[Excel Export] Updated Excel/CSV file at: ${csvFilePath}`);
  } catch (error) {
    console.warn("[Excel Export] Local CSV file update skipped (read-only filesystem):", error);
  }
}
function registerExcelExportRoute(app2) {
  const handler = async (_req, res) => {
    try {
      const csvContent = await generateCsvString();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="VVLF_Student_Applications_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv"`
      );
      res.status(200).send("\uFEFF" + csvContent);
    } catch (error) {
      console.error("[Excel Export] Error generating export:", error);
      res.status(500).send("Error generating spreadsheet export");
    }
  };
  app2.get("/api/export-csv", handler);
  app2.get("/api/export-excel", handler);
}

// server/adminAuth.ts
import bcrypt from "bcryptjs";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
import fs4 from "fs";
import path4 from "path";
var ADMIN_COOKIE_NAME = "vvlf_admin_session";
var SESSION_EXPIRY_HOURS = 8;
var MAX_ATTEMPTS = 5;
var WINDOW_MS = 15 * 60 * 1e3;
var rateLimitMap = /* @__PURE__ */ new Map();
function getAdminAccounts() {
  if (process.env.ADMIN_ACCOUNTS) {
    try {
      const parsed = JSON.parse(process.env.ADMIN_ACCOUNTS);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      console.warn("[AdminAuth] ADMIN_ACCOUNTS env is not valid JSON");
    }
  }
  const username = process.env.ADMIN_USERNAME || "admin";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "$2b$10$oOBL75mo84LS0u3UfDoGQugBDreEClao3StuJ9J53G9jD5vi96TKO";
  return [
    {
      username,
      passwordHash,
      displayName: process.env.ADMIN_DISPLAY_NAME || "VVLF Administrator",
      role: "owner",
      active: true
    }
  ];
}
function findAdminByUsername(username) {
  return getAdminAccounts().find(
    (a) => a.active && a.username.toLowerCase() === username.toLowerCase()
  );
}
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? "vvlf-admin-secret-change-in-production";
  return new TextEncoder().encode(`admin:${secret}`);
}
async function createAdminSession(username, role) {
  return new SignJWT2({ username, role, type: "admin_session" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_EXPIRY_HOURS}h`).setSubject(`admin:${username}`).sign(getJwtSecret());
}
async function verifyAdminSession(token) {
  try {
    const { payload } = await jwtVerify2(token, getJwtSecret());
    if (payload.type === "admin_session" && typeof payload.username === "string" && typeof payload.role === "string") {
      return { username: payload.username, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}
function resetRateLimit(ip) {
  rateLimitMap.delete(ip);
}
var AUDIT_LOG_PATH = path4.resolve(process.cwd(), "data/audit_log.json");
function ensureAuditDir() {
  const dir = path4.dirname(AUDIT_LOG_PATH);
  if (!fs4.existsSync(dir)) fs4.mkdirSync(dir, { recursive: true });
}
function writeAuditLog(entry) {
  try {
    ensureAuditDir();
    let log = [];
    if (fs4.existsSync(AUDIT_LOG_PATH)) {
      try {
        log = JSON.parse(fs4.readFileSync(AUDIT_LOG_PATH, "utf-8"));
      } catch {
      }
    }
    const full = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...entry
    };
    log.unshift(full);
    if (log.length > 2e3) log = log.slice(0, 2e3);
    fs4.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuditLog] Could not write:", err);
  }
}
function readAuditLog(limit = 200) {
  try {
    if (!fs4.existsSync(AUDIT_LOG_PATH)) return [];
    const log = JSON.parse(fs4.readFileSync(AUDIT_LOG_PATH, "utf-8"));
    return log.slice(0, limit);
  } catch {
    return [];
  }
}
function getAdminCookieOptions(isProduction) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60 * 1e3
  };
}

// server/qualityScore.ts
var TRACK_CORE_SKILLS = {
  "Startups & Business": [
    "Business Development",
    "Market Research",
    "Strategy",
    "Partnerships",
    "Excel / Sheets",
    "PowerPoint / Slides",
    "Market Research & Analysis",
    "Research & Synthesis",
    "Strategic Thinking"
  ],
  "Technology & Product": [
    "React",
    "TypeScript",
    "Python",
    "Node.js",
    "API Integration",
    "Git/GitHub",
    "AI / LLMs",
    "Product Thinking",
    "Web / Coding",
    "Full-Stack Dev",
    "Mobile Dev",
    "Dev Tooling"
  ],
  "Creative & Media": [
    "Video Editing",
    "Motion Graphics",
    "After Effects",
    "Premiere Pro",
    "Photography",
    "3D / Blender",
    "Illustration",
    "Graphic Design",
    "Figma (App/Web UI)",
    "Canva",
    "AI Image Tools"
  ],
  "Content & Community": [
    "Copywriting",
    "Content Writing",
    "Short-form Video (Reels/TikTok)",
    "Community Management",
    "Email Campaigns",
    "Social Media Strategy",
    "Newsletter/Blog",
    "Storytelling"
  ],
  "Explore & Build": [
    "Curious, ready to learn",
    "Prompt Engineering",
    "Research & Synthesis",
    "Strategic Thinking",
    "Business Development"
  ]
};
var HIGH_VALUE_SKILLS = /* @__PURE__ */ new Set([
  "React",
  "TypeScript",
  "Python",
  "Node.js",
  "AI / LLMs",
  "Motion Graphics",
  "After Effects",
  "Figma (App/Web UI)",
  "Video Editing",
  "Full-Stack Dev",
  "Product Thinking",
  "Market Research & Analysis",
  "Strategic Thinking",
  "Short-form Video (Reels/TikTok)",
  "3D / Blender"
]);
function scoreInterestFit(track, skills, workAreas) {
  const coreSkills = TRACK_CORE_SKILLS[track] ?? [];
  if (coreSkills.length === 0) return 10;
  const matchCount = skills.filter(
    (s) => coreSkills.some((c) => c.toLowerCase() === s.toLowerCase())
  ).length;
  const workAreaMatch = workAreas.some(
    (w) => coreSkills.some((c) => c.toLowerCase().includes(w.toLowerCase().slice(0, 6)))
  );
  const baseRatio = Math.min(matchCount / Math.max(coreSkills.length * 0.3, 1), 1);
  return Math.round(baseRatio * 16 + (workAreaMatch ? 4 : 0));
}
function scoreSkillDepth(skills) {
  if (skills.length === 0) return 0;
  const count = Math.min(skills.length, 10);
  const highValueCount = skills.filter((s) => HIGH_VALUE_SKILLS.has(s)).length;
  const countScore = Math.min(count, 8);
  const hvScore = Math.min(highValueCount * 2, 12);
  const diversityBonus = Math.min(Math.floor(count / 3), 5);
  return Math.min(countScore + hvScore + diversityBonus, 25);
}
function scoreProofOfWork(portfolioLink, noWorkToShare) {
  if (noWorkToShare) return 5;
  if (!portfolioLink) return 0;
  const link = portfolioLink.trim().toLowerCase();
  if (link === "" || link === "n/a" || link === "na" || link === "none") return 2;
  if (link.includes("github.com")) return 25;
  if (link.includes("behance.net")) return 23;
  if (link.includes("dribbble.com")) return 23;
  if (link.includes("figma.com")) return 22;
  if (link.includes("youtube.com") || link.includes("youtu.be")) return 20;
  if (link.includes("linkedin.com")) return 15;
  if (link.startsWith("http")) return 18;
  return 8;
}
function scoreAvailability(availabilityHours) {
  if (!availabilityHours) return 5;
  const h = availabilityHours.toLowerCase();
  if (h.includes("20") || h.includes("20+")) return 15;
  if (h.includes("12") || h.includes("12-20")) return 13;
  if (h.includes("8") || h.includes("8-12")) return 11;
  if (h.includes("5") || h.includes("5-8")) return 7;
  return 5;
}
function scoreStudyYear(studyYear) {
  if (!studyYear) return 8;
  const y = studyYear.toLowerCase();
  if (y.includes("3rd") || y.includes("4th") || y.includes("final")) return 15;
  if (y.includes("2nd")) return 13;
  if (y.includes("1st")) return 10;
  return 8;
}
function parseToolsField(rawTools) {
  try {
    const parsed = JSON.parse(rawTools);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        workAreas: Array.isArray(parsed.workAreas) ? parsed.workAreas : [],
        category: parsed.category ?? "",
        secondaryCategory: parsed.secondaryCategory ?? "",
        availabilityHours: parsed.availabilityHours ?? "",
        noWorkToShare: Boolean(parsed.noWorkToShare)
      };
    }
    if (Array.isArray(parsed)) {
      return {
        skills: parsed,
        workAreas: [],
        category: "",
        secondaryCategory: "",
        availabilityHours: "",
        noWorkToShare: false
      };
    }
  } catch {
  }
  return { skills: [], workAreas: [], category: "", secondaryCategory: "", availabilityHours: "", noWorkToShare: false };
}
function computeQualityScore(app2) {
  const parsed = parseToolsField(app2.tools);
  const interestFit = scoreInterestFit(app2.track, parsed.skills, parsed.workAreas);
  const skillDepth = scoreSkillDepth(parsed.skills);
  const proofOfWork = scoreProofOfWork(app2.portfolioLink, parsed.noWorkToShare);
  const availability = scoreAvailability(parsed.availabilityHours);
  const studyYear = scoreStudyYear(app2.studyYear);
  const total = Math.min(interestFit + skillDepth + proofOfWork + availability + studyYear, 100);
  let tier;
  if (total >= 90) tier = "exceptional";
  else if (total >= 80) tier = "strong";
  else if (total >= 70) tier = "potential";
  else if (total >= 60) tier = "review";
  else tier = "low";
  return { interestFit, skillDepth, proofOfWork, availability, studyYear, total, tier };
}

// server/analytics.ts
function normalizeTrack(raw) {
  if (!raw) return "Explore & Build";
  const r = raw.trim();
  const lower = r.toLowerCase();
  if (lower.includes("startup") || lower.includes("business")) return "Startups & Business";
  if (lower.includes("tech") || lower.includes("web") || lower.includes("product") || lower.includes("code")) return "Technology & Product";
  if (lower.includes("creative") || lower.includes("media") || lower.includes("design") || lower.includes("visual") || lower.includes("video")) return "Creative & Media";
  if (lower.includes("content") || lower.includes("community") || lower.includes("social") || lower.includes("writing")) return "Content & Community";
  if (lower.includes("explore") || lower.includes("build") || lower.includes("learn")) return "Explore & Build";
  return "Explore & Build";
}
function getSource(app2) {
  if (app2.source && app2.source.trim()) return app2.source.trim();
  return "Direct";
}
function enrichApplications(apps, metaMap) {
  return apps.map((app2) => {
    const parsed = parseToolsField(app2.tools);
    const score = computeQualityScore(app2);
    const meta = metaMap.get(app2.id);
    const canonicalTrack = normalizeTrack(app2.track || parsed.category);
    return {
      ...app2,
      track: canonicalTrack,
      score: meta?.scoreOverride ?? score.total,
      tier: score.tier,
      scoreBreakdown: {
        interestFit: score.interestFit,
        skillDepth: score.skillDepth,
        proofOfWork: score.proofOfWork,
        availability: score.availability,
        studyYear: score.studyYear
      },
      skills: parsed.skills,
      workAreas: parsed.workAreas,
      secondaryCategory: parsed.secondaryCategory,
      availabilityHours: parsed.availabilityHours,
      recommendedRole: suggestRole(canonicalTrack, parsed.skills),
      status: meta?.status ?? "new",
      notes: meta?.notes ?? ""
    };
  });
}
function getOverviewStats(apps, targetApplication = 500, targetSelection = 100) {
  const total = apps.length;
  const strong = apps.filter((a) => a.score >= 80).length;
  const exceptional = apps.filter((a) => a.score >= 90).length;
  const avgScore = total > 0 ? Math.round(apps.reduce((s, a) => s + a.score, 0) / total) : 0;
  const selected = apps.filter((a) => a.status === "selected").length;
  const unreviewedHP = apps.filter(
    (a) => a.score >= 80 && (a.status === "new" || a.status === "screening")
  ).length;
  const trackCounts = /* @__PURE__ */ new Map();
  for (const a of apps) {
    trackCounts.set(a.track, (trackCounts.get(a.track) ?? 0) + 1);
  }
  let topTrack = "";
  let topTrackCount = 0;
  for (const [track, count] of trackCounts) {
    if (count > topTrackCount) {
      topTrack = track;
      topTrackCount = count;
    }
  }
  return {
    totalApplications: total,
    completionRate: Math.round(total / Math.max(total * 1.33, 1) * 100),
    // estimated
    strongCandidates: strong,
    exceptionalCandidates: exceptional,
    avgScore,
    targetApplication,
    targetSelection,
    selectedCount: selected,
    unreviewedHighPotential: unreviewedHP,
    incompleteCount: 0,
    topTrack,
    topTrackCount
  };
}
function getTrendData(apps, days = 14) {
  const now = /* @__PURE__ */ new Date();
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = apps.filter((a) => {
      const appDate = new Date(a.createdAt).toISOString().slice(0, 10);
      return appDate === dateStr;
    }).length;
    const label = d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
    points.push({ date: dateStr, count, label });
  }
  return points;
}
var ALL_TRACKS = [
  "Technology & Product",
  "Startups & Business",
  "Creative & Media",
  "Content & Community",
  "Explore & Build"
];
var ALL_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];
function getTrackDistribution(apps) {
  const total = apps.length || 1;
  const map = /* @__PURE__ */ new Map();
  for (const track of ALL_TRACKS) {
    map.set(track, []);
  }
  for (const a of apps) {
    const list = map.get(a.track) ?? [];
    list.push(a);
    map.set(a.track, list);
  }
  const result = [];
  for (const [track, list] of map) {
    const strong = list.filter((a) => a.score >= 80).length;
    const avg = list.length > 0 ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length) : 0;
    result.push({
      track,
      count: list.length,
      pct: Math.round(list.length / total * 100),
      strongCount: strong,
      strongRate: list.length > 0 ? Math.round(strong / list.length * 100) : 0,
      avgScore: avg
    });
  }
  return result.sort((a, b) => b.count - a.count);
}
function getSourceBreakdown(apps) {
  const total = apps.length || 1;
  const map = /* @__PURE__ */ new Map();
  for (const a of apps) {
    const src = getSource(a);
    const list = map.get(src) ?? [];
    list.push(a);
    map.set(src, list);
  }
  const result = [];
  for (const [source, list] of map) {
    const strong = list.filter((a) => a.score >= 80).length;
    const avg = Math.round(list.reduce((s, a) => s + a.score, 0) / list.length);
    result.push({
      source,
      count: list.length,
      pct: Math.round(list.length / total * 100),
      strongCount: strong,
      strongRate: list.length > 0 ? Math.round(strong / list.length * 100) : 0,
      avgScore: avg
    });
  }
  return result.sort((a, b) => b.count - a.count);
}
function getSkillFrequency(apps) {
  const total = apps.length || 1;
  const skillMap = /* @__PURE__ */ new Map();
  for (const a of apps) {
    for (const skill of a.skills) {
      if (!skill.trim()) continue;
      const entry = skillMap.get(skill) ?? { count: 0, tracks: /* @__PURE__ */ new Set() };
      entry.count++;
      entry.tracks.add(a.track);
      skillMap.set(skill, entry);
    }
  }
  const result = [];
  for (const [skill, { count, tracks }] of skillMap) {
    result.push({
      skill,
      count,
      pct: Math.round(count / total * 100),
      tracks: Array.from(tracks)
    });
  }
  return result.sort((a, b) => b.count - a.count);
}
function getYearDistribution(apps) {
  const total = apps.length || 1;
  const map = /* @__PURE__ */ new Map();
  for (const yr of ALL_YEARS) {
    map.set(yr, 0);
  }
  for (const a of apps) {
    const y = a.studyYear || "Unknown";
    map.set(y, (map.get(y) ?? 0) + 1);
  }
  return Array.from(map).map(([label, count]) => ({ label, count, pct: Math.round(count / total * 100) })).sort((a, b) => b.count - a.count);
}
function getBranchDistribution(apps) {
  const total = apps.length || 1;
  const map = /* @__PURE__ */ new Map();
  for (const a of apps) {
    const dept = a.department || "Unknown";
    const short = dept.length > 30 ? dept.slice(0, 30) + "\u2026" : dept;
    map.set(short, (map.get(short) ?? 0) + 1);
  }
  return Array.from(map).map(([label, count]) => ({ label, count, pct: Math.round(count / total * 100) })).sort((a, b) => b.count - a.count).slice(0, 10);
}
function getFunnelData(apps) {
  const submitted = apps.length;
  const step2 = Math.round(submitted / 0.93);
  const step1 = Math.round(step2 / 0.9);
  const started = Math.round(step1 / 0.88);
  const visits = Math.round(started / 0.78);
  const stages = [
    { stage: "Page Visits", count: visits, estimated: true },
    { stage: "Started Application", count: started, estimated: true },
    { stage: "Chose Track & Skills", count: step1, estimated: true },
    { stage: "Completed About You", count: step2, estimated: true },
    { stage: "Submitted", count: submitted, estimated: false }
  ];
  return stages.map((s, i) => {
    const prev = i > 0 ? stages[i - 1].count : null;
    const conversionFromPrev = prev ? Math.round(s.count / prev * 100) : null;
    const dropOff = prev ? prev - s.count : null;
    return {
      stage: s.stage,
      count: s.count,
      conversionFromPrev,
      dropOff,
      isEstimated: s.estimated
    };
  });
}
function getScoreDistribution(apps) {
  const bins = [
    { range: "90-100", min: 90, max: 100 },
    { range: "80-89", min: 80, max: 89 },
    { range: "70-79", min: 70, max: 79 },
    { range: "60-69", min: 60, max: 69 },
    { range: "< 60", min: 0, max: 59 }
  ];
  return bins.map((b) => ({
    range: b.range,
    count: apps.filter((a) => a.score >= b.min && a.score <= b.max).length
  }));
}
function getTopCandidates(apps, limit = 100) {
  return [...apps].sort((a, b) => b.score - a.score).slice(0, limit);
}
function getInterestCombos(apps) {
  const map = /* @__PURE__ */ new Map();
  for (const a of apps) {
    if (a.track && a.secondaryCategory && a.track !== a.secondaryCategory) {
      const key = `${a.track}|${a.secondaryCategory}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map).map(([key, count]) => {
    const [primary, secondary] = key.split("|");
    return { primary, secondary, count };
  }).sort((a, b) => b.count - a.count).slice(0, 10);
}
function suggestRole(track, skills) {
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));
  if (track === "Technology & Product") {
    if (skillSet.has("ai / llms") || skillSet.has("python")) return "AI & Automation Engineering";
    if (skillSet.has("react") || skillSet.has("full-stack dev")) return "Digital Product & Full-Stack";
    if (skillSet.has("figma (app/web ui)")) return "Product Design";
    return "Technology";
  }
  if (track === "Creative & Media") {
    if (skillSet.has("motion graphics") || skillSet.has("after effects")) return "Video, Motion & Post-Production";
    if (skillSet.has("3d / blender")) return "3D & Visual Production";
    if (skillSet.has("photography")) return "Photography & Visual";
    return "Creative Production";
  }
  if (track === "Content & Community") {
    if (skillSet.has("short-form video (reels/tiktok)")) return "Social Media & Reels";
    if (skillSet.has("copywriting") || skillSet.has("content writing")) return "Content & Copywriting";
    return "Community & Growth";
  }
  if (track === "Startups & Business") {
    if (skillSet.has("market research & analysis")) return "Venture Intelligence & Research";
    if (skillSet.has("business development")) return "Business Development";
    return "Strategy & Operations";
  }
  return "General";
}

// server/candidateMeta.ts
import fs5 from "fs";
import path5 from "path";
var META_PATH = path5.resolve(process.cwd(), "data/candidate_meta.json");
var CANDIDATE_STATUS_LABELS = {
  new: "New",
  screening: "Screening",
  shortlisted: "Shortlisted",
  challenge_sent: "Challenge Sent",
  challenge_done: "Challenge Done",
  interview: "Interview",
  selected: "Selected",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
};
var inMemoryMeta = /* @__PURE__ */ new Map();
var useMemory = false;
function ensureDir() {
  const dir = path5.dirname(META_PATH);
  if (!fs5.existsSync(dir)) fs5.mkdirSync(dir, { recursive: true });
}
function readAllMeta() {
  if (useMemory) return inMemoryMeta;
  try {
    ensureDir();
    if (!fs5.existsSync(META_PATH)) return /* @__PURE__ */ new Map();
    const raw = fs5.readFileSync(META_PATH, "utf-8");
    const arr = JSON.parse(raw);
    return new Map(arr.map((m) => [m.id, m]));
  } catch {
    return /* @__PURE__ */ new Map();
  }
}
function writeAllMeta(map) {
  if (useMemory) {
    inMemoryMeta = map;
    return;
  }
  try {
    ensureDir();
    fs5.writeFileSync(META_PATH, JSON.stringify(Array.from(map.values()), null, 2), "utf-8");
  } catch {
    console.warn("[CandidateMeta] Filesystem is read-only, falling back to memory");
    useMemory = true;
    inMemoryMeta = map;
  }
}
function getAllCandidateMeta() {
  return readAllMeta();
}
function setCandidateMeta(id, updates, updatedBy) {
  const all = readAllMeta();
  const existing = all.get(id) ?? {
    id,
    status: "new",
    notes: "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const updated = {
    ...existing,
    ...updates,
    id,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: updatedBy ?? existing.updatedBy
  };
  all.set(id, updated);
  writeAllMeta(all);
  return updated;
}

// server/routers.ts
import { parse as parseCookieHeader3 } from "cookie";
async function requireAdminSession(req) {
  const cookies = parseCookieHeader3(req.headers.cookie ?? "");
  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Admin session required" });
  const session = await verifyAdminSession(token);
  if (!session) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Session expired. Please log in again." });
  return session;
}
function publicQuestion(question) {
  let options = [];
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
    position: question.position
  };
}
var appRouter = router({
  system: systemRouter,
  // -------------------------------------------------------------------------
  // Existing auth (OAuth / session)
  // -------------------------------------------------------------------------
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // -------------------------------------------------------------------------
  // Admin authentication (username + password, separate from OAuth)
  // -------------------------------------------------------------------------
  admin: router({
    login: publicProcedure.input(z4.object({ username: z4.string().min(1).max(80), password: z4.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket?.remoteAddress ?? "unknown";
      const rateCheck = checkRateLimit(ip);
      if (!rateCheck.allowed) {
        writeAuditLog({ adminUsername: input.username, action: "login_rate_limited", ip });
        throw new TRPCError3({
          code: "TOO_MANY_REQUESTS",
          message: "Too many login attempts. Please wait 15 minutes before trying again."
        });
      }
      const account = findAdminByUsername(input.username);
      if (!account) {
        writeAuditLog({ adminUsername: input.username, action: "login_failed_user_not_found", ip });
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      }
      const passwordOk = await verifyPassword(input.password, account.passwordHash);
      if (!passwordOk) {
        writeAuditLog({ adminUsername: input.username, action: "login_failed_wrong_password", ip });
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      }
      resetRateLimit(ip);
      const token = await createAdminSession(account.username, account.role);
      const cookieOptions = getAdminCookieOptions(ENV.isProduction);
      ctx.res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);
      writeAuditLog({ adminUsername: account.username, action: "login_success", ip });
      return { success: true, username: account.username, displayName: account.displayName, role: account.role };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const session = await verifyAdminSession(
        parseCookieHeader3(ctx.req.headers.cookie ?? "")[ADMIN_COOKIE_NAME] ?? ""
      ).catch(() => null);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
      if (session) writeAuditLog({ adminUsername: session.username, action: "logout" });
      return { success: true };
    }),
    me: publicProcedure.query(async ({ ctx }) => {
      const token = parseCookieHeader3(ctx.req.headers.cookie ?? "")[ADMIN_COOKIE_NAME];
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
      return enrichApplications(raw, metaMap);
    }),
    // -----------------------------------------------------------------------
    // Overview stats
    // -----------------------------------------------------------------------
    overviewStats: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      const raw = await listApplications();
      const metaMap = getAllCandidateMeta();
      const enriched = enrichApplications(raw, metaMap);
      return getOverviewStats(enriched);
    }),
    // -----------------------------------------------------------------------
    // Analytics data
    // -----------------------------------------------------------------------
    analyticsData: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      const raw = await listApplications();
      const metaMap = getAllCandidateMeta();
      const enriched = enrichApplications(raw, metaMap);
      return {
        trend: getTrendData(raw),
        trackDistribution: getTrackDistribution(enriched),
        sourceBreakdown: getSourceBreakdown(enriched),
        skillFrequency: getSkillFrequency(enriched),
        yearDistribution: getYearDistribution(raw),
        branchDistribution: getBranchDistribution(raw),
        funnel: getFunnelData(raw),
        scoreDistribution: getScoreDistribution(enriched),
        topCandidates: getTopCandidates(enriched, 50),
        interestCombos: getInterestCombos(enriched),
        overviewStats: getOverviewStats(enriched)
      };
    }),
    // -----------------------------------------------------------------------
    // Update candidate status / notes
    // -----------------------------------------------------------------------
    updateCandidate: publicProcedure.input(z4.object({
      id: z4.number().int().positive(),
      status: z4.enum([
        "new",
        "screening",
        "shortlisted",
        "challenge_sent",
        "challenge_done",
        "interview",
        "selected",
        "waitlisted",
        "rejected",
        "withdrawn"
      ]).optional(),
      notes: z4.string().max(2e3).optional(),
      scoreOverride: z4.number().min(0).max(100).optional()
    })).mutation(async ({ input, ctx }) => {
      const session = await requireAdminSession(ctx.req);
      const meta = setCandidateMeta(input.id, {
        ...input.status ? { status: input.status } : {},
        ...input.notes !== void 0 ? { notes: input.notes } : {},
        ...input.scoreOverride !== void 0 ? { scoreOverride: input.scoreOverride } : {}
      }, session.username);
      writeAuditLog({
        adminUsername: session.username,
        action: "update_candidate",
        target: `candidate #${input.id}`,
        metadata: { status: input.status, hasNotes: Boolean(input.notes) }
      });
      return { success: true, meta };
    }),
    // -----------------------------------------------------------------------
    // Audit log
    // -----------------------------------------------------------------------
    auditLog: publicProcedure.input(z4.object({ limit: z4.number().int().positive().max(500).default(100) })).query(async ({ input, ctx }) => {
      const session = await requireAdminSession(ctx.req);
      if (session.role === "reviewer") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Reviewers cannot access the audit log." });
      }
      return readAuditLog(input.limit);
    }),
    // -----------------------------------------------------------------------
    // Admin accounts list (owners only)
    // -----------------------------------------------------------------------
    listAdminAccounts: publicProcedure.query(async ({ ctx }) => {
      const session = await requireAdminSession(ctx.req);
      if (session.role !== "owner") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Only owners can view admin accounts." });
      }
      return getAdminAccounts().map((a) => ({
        username: a.username,
        displayName: a.displayName,
        role: a.role,
        active: a.active
      }));
    }),
    statusLabels: publicProcedure.query(async ({ ctx }) => {
      await requireAdminSession(ctx.req);
      return CANDIDATE_STATUS_LABELS;
    })
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
            noWorkToShare: enriched.noWorkToShare
          }),
          focus: enriched.focus,
          portfolioLink: enriched.portfolioLink,
          goal: enriched.goal,
          workstation: enriched.workstation,
          consent: enriched.consent,
          source: enriched.source
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
            consent: enriched.consent
          });
        } catch (sheetsErr) {
          console.error("[Sheets Sync] Error:", sheetsErr);
        }
        updateLocalCsvFile().catch(() => {
        });
        return {
          success: true,
          recommendedRole: enriched.recommendedRole
        };
      } catch (error) {
        console.error("[Application] Submission failed", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not save your application. Please try again in a moment."
        });
      }
    }),
    list: adminProcedure.query(async () => {
      try {
        return await listApplications();
      } catch (error) {
        console.error("[Application] Listing failed", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not load applications. Please try again in a moment."
        });
      }
    })
  }),
  // -------------------------------------------------------------------------
  // Existing studio routes
  // -------------------------------------------------------------------------
  studio: router({
    list: protectedProcedure.query(async ({ ctx }) => listOwnedStudioForms(ctx.user.id)),
    get: protectedProcedure.input(z4.object({ formId: z4.number().int().positive() })).query(async ({ ctx, input }) => {
      const result = await getOwnedStudioForm(ctx.user.id, input.formId);
      if (!result) throw new TRPCError3({ code: "NOT_FOUND", message: "Form not found." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    create: protectedProcedure.input(studioFormInputSchema).mutation(async ({ ctx, input }) => {
      const formId = await createOwnedStudioForm(ctx.user.id, input);
      return { formId };
    }),
    update: protectedProcedure.input(z4.object({ formId: z4.number().int().positive(), data: studioFormInputSchema })).mutation(async ({ ctx, input }) => {
      const updated = await updateOwnedStudioForm(ctx.user.id, input.formId, input.data);
      if (!updated) throw new TRPCError3({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true };
    }),
    setStatus: protectedProcedure.input(z4.object({ formId: z4.number().int().positive(), status: z4.enum(["draft", "published"]) })).mutation(async ({ ctx, input }) => {
      const updated = await setStudioFormStatus(ctx.user.id, input.formId, input.status);
      if (!updated) throw new TRPCError3({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true };
    }),
    responses: protectedProcedure.input(z4.object({ formId: z4.number().int().positive() })).query(async ({ ctx, input }) => {
      const responses = await listOwnedStudioResponses(ctx.user.id, input.formId);
      if (!responses) throw new TRPCError3({ code: "NOT_FOUND", message: "Form not found." });
      return responses;
    }),
    publicGet: publicProcedure.input(z4.object({ slug: z4.string().min(1).max(140) })).query(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new TRPCError3({ code: "NOT_FOUND", message: "This form is unavailable." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    submit: publicProcedure.input(z4.object({ slug: z4.string().min(1).max(140), answers: z4.record(z4.string(), z4.unknown()) })).mutation(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new TRPCError3({ code: "NOT_FOUND", message: "This form is unavailable." });
      try {
        const answers = validateStudioResponse(result.questions.map(publicQuestion), input.answers);
        await createStudioResponse({ formId: result.form.id, answers: JSON.stringify(answers) });
        return { success: true, redirectUrl: result.form.redirectUrl };
      } catch (error) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Please review your answers." });
      }
    })
  })
});

// api/handler.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
registerExcelExportRoute(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
var handler_default = app;
export {
  handler_default as default
};
