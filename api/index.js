"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/handler.ts
var handler_exports = {};
__export(handler_exports, {
  default: () => handler_default
});
module.exports = __toCommonJS(handler_exports);
var import_express = __toESM(require("express"), 1);
var import_express2 = require("@trpc/server/adapters/express");

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
var import_cookie2 = require("cookie");

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_mysql2 = require("drizzle-orm/mysql2");

// drizzle/schema.ts
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_mysql_core.text)("name"),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var applications = (0, import_mysql_core.mysqlTable)("applications", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  fullName: (0, import_mysql_core.varchar)("fullName", { length: 150 }).notNull(),
  college: (0, import_mysql_core.varchar)("college", { length: 200 }).notNull(),
  department: (0, import_mysql_core.varchar)("department", { length: 160 }).notNull(),
  studyYear: (0, import_mysql_core.varchar)("studyYear", { length: 40 }).notNull(),
  whatsapp: (0, import_mysql_core.varchar)("whatsapp", { length: 32 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  track: (0, import_mysql_core.varchar)("track", { length: 80 }).notNull(),
  tools: (0, import_mysql_core.text)("tools").notNull(),
  focus: (0, import_mysql_core.text)("focus").notNull(),
  portfolioLink: (0, import_mysql_core.varchar)("portfolioLink", { length: 1e3 }),
  goal: (0, import_mysql_core.varchar)("goal", { length: 180 }).notNull(),
  workstation: (0, import_mysql_core.varchar)("workstation", { length: 180 }).notNull(),
  consent: (0, import_mysql_core.boolean)("consent").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var studioForms = (0, import_mysql_core.mysqlTable)("studioForms", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  ownerId: (0, import_mysql_core.int)("ownerId").notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 180 }).notNull(),
  slug: (0, import_mysql_core.varchar)("slug", { length: 140 }).notNull().unique(),
  description: (0, import_mysql_core.text)("description"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "published"]).default("draft").notNull(),
  successMessage: (0, import_mysql_core.text)("successMessage").notNull(),
  redirectUrl: (0, import_mysql_core.varchar)("redirectUrl", { length: 1e3 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var studioQuestions = (0, import_mysql_core.mysqlTable)("studioQuestions", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  formId: (0, import_mysql_core.int)("formId").notNull(),
  kind: (0, import_mysql_core.mysqlEnum)("kind", ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"]).notNull(),
  label: (0, import_mysql_core.varchar)("label", { length: 300 }).notNull(),
  helpText: (0, import_mysql_core.text)("helpText"),
  options: (0, import_mysql_core.text)("options"),
  required: (0, import_mysql_core.boolean)("required").default(false).notNull(),
  position: (0, import_mysql_core.int)("position").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var studioResponses = (0, import_mysql_core.mysqlTable)("studioResponses", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  formId: (0, import_mysql_core.int)("formId").notNull(),
  answers: (0, import_mysql_core.text)("answers").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});

// server/db.ts
var import_nanoid = require("nanoid");

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = (0, import_mysql2.drizzle)(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createApplication(application) {
  const db = await getDb();
  if (!db) throw new Error("Application storage is unavailable.");
  await db.insert(applications).values(application);
}
async function listApplications() {
  const db = await getDb();
  if (!db) throw new Error("Application storage is unavailable.");
  return db.select().from(applications).orderBy((0, import_drizzle_orm.desc)(applications.createdAt));
}
function makeStudioSlug(title) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "form";
  return `${base}-${(0, import_nanoid.nanoid)(7).toLowerCase()}`;
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
  return db.select().from(studioForms).where((0, import_drizzle_orm.eq)(studioForms.ownerId, ownerId)).orderBy((0, import_drizzle_orm.desc)(studioForms.updatedAt));
}
async function getOwnedStudioForm(ownerId, formId) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(studioForms.id, formId), (0, import_drizzle_orm.eq)(studioForms.ownerId, ownerId))).limit(1);
  if (!forms[0]) return void 0;
  const questions = await db.select().from(studioQuestions).where((0, import_drizzle_orm.eq)(studioQuestions.formId, formId)).orderBy((0, import_drizzle_orm.asc)(studioQuestions.position));
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
  const inserted = await db.insert(studioForms).values(value);
  const formId = inserted[0].insertId;
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return formId;
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
    redirectUrl: input.redirectUrl || null
  }).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(studioForms.id, formId), (0, import_drizzle_orm.eq)(studioForms.ownerId, ownerId)));
  await db.delete(studioQuestions).where((0, import_drizzle_orm.eq)(studioQuestions.formId, formId));
  await db.insert(studioQuestions).values(questionValues(formId, input.questions));
  return true;
}
async function setStudioFormStatus(ownerId, formId, status) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const result = await db.update(studioForms).set({ status }).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(studioForms.id, formId), (0, import_drizzle_orm.eq)(studioForms.ownerId, ownerId)));
  return result[0].affectedRows > 0;
}
async function getPublishedStudioForm(slug) {
  const db = await getDb();
  if (!db) throw new Error("Form Studio storage is unavailable.");
  const forms = await db.select().from(studioForms).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(studioForms.slug, slug), (0, import_drizzle_orm.eq)(studioForms.status, "published"))).limit(1);
  if (!forms[0]) return void 0;
  const questions = await db.select().from(studioQuestions).where((0, import_drizzle_orm.eq)(studioQuestions.formId, forms[0].id)).orderBy((0, import_drizzle_orm.asc)(studioQuestions.position));
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
  const responses = await db.select().from(studioResponses).where((0, import_drizzle_orm.eq)(studioResponses.formId, formId)).orderBy((0, import_drizzle_orm.desc)(studioResponses.createdAt));
  return responses;
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
var import_axios = __toESM(require("axios"), 1);
var import_cookie = require("cookie");
var import_jose = require("jose");
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
var createOAuthHttpClient = () => import_axios.default.create({
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
    const parsed = (0, import_cookie.parse)(cookieHeader);
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
    return new import_jose.SignJWT({
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
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
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
    const expectedNonce = (0, import_cookie2.parse)(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
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
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
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
var import_server3 = require("@trpc/server");
var import_zod4 = require("zod");

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
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
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
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
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
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
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
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
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/application.ts
var import_zod2 = require("zod");
var trackOptions = [
  "Design & Visuals",
  "Video & Media",
  "Tech & Web",
  "Content & Events",
  "Fast Learner / Generalist"
];
var studyYearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
var goalOptions = [
  "Build real projects to boost my resume",
  "Learn modern tools & AI workflows",
  "Gain leadership & event experience",
  "Connect with peers and mentors"
];
var workstationOptions = [
  "I have my own personal laptop",
  "I will use campus systems and foundation labs"
];
var applicationInputSchema = import_zod2.z.object({
  fullName: import_zod2.z.string().trim().min(2, "Please enter your full name.").max(150),
  college: import_zod2.z.string().trim().min(2, "Please enter your college name.").max(200),
  department: import_zod2.z.string().trim().min(2, "Please enter your department or branch.").max(160),
  studyYear: import_zod2.z.enum(studyYearOptions),
  whatsapp: import_zod2.z.string().trim().min(7, "Please enter a valid WhatsApp number.").max(32),
  email: import_zod2.z.string().trim().email("Please enter a valid email address.").max(320),
  track: import_zod2.z.enum(trackOptions),
  tools: import_zod2.z.array(import_zod2.z.string().trim().min(1).max(100)).min(1, "Choose at least one capability.").max(6),
  focus: import_zod2.z.string().trim().min(2, "Choose the answer that fits you best.").max(220),
  portfolioLink: import_zod2.z.union([import_zod2.z.literal(""), import_zod2.z.string().url("Use a complete https:// link.").max(1e3)]),
  goal: import_zod2.z.enum(goalOptions),
  workstation: import_zod2.z.enum(workstationOptions),
  consent: import_zod2.z.literal(true, { error: "Please confirm the consent statement before submitting." })
});

// server/formStudio.ts
var import_zod3 = require("zod");
var studioQuestionKinds = ["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice", "consent"];
var studioQuestionInputSchema = import_zod3.z.object({
  kind: import_zod3.z.enum(studioQuestionKinds),
  label: import_zod3.z.string().trim().min(1, "Every question needs a label.").max(300),
  helpText: import_zod3.z.string().trim().max(1e3).optional().default(""),
  options: import_zod3.z.array(import_zod3.z.string().trim().min(1).max(160)).max(25).optional().default([]),
  required: import_zod3.z.boolean().default(false),
  position: import_zod3.z.number().int().min(0)
});
var studioFormInputSchema = import_zod3.z.object({
  title: import_zod3.z.string().trim().min(2, "Give your form a title.").max(180),
  description: import_zod3.z.string().trim().max(3e3).optional().default(""),
  successMessage: import_zod3.z.string().trim().min(2, "Add a short confirmation message.").max(3e3),
  redirectUrl: import_zod3.z.string().trim().max(1e3).optional().default(""),
  questions: import_zod3.z.array(studioQuestionInputSchema).min(1, "Add at least one question.")
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

// server/routers.ts
function publicQuestion(question) {
  let options = [];
  try {
    options = question.options ? JSON.parse(question.options) : [];
  } catch {
    options = [];
  }
  return { id: question.id, kind: question.kind, label: question.label, helpText: question.helpText || "", options, required: question.required, position: question.position };
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
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
          consent: input.consent
        });
        return { success: true };
      } catch (error) {
        console.error("[Application] Submission failed", error);
        throw new import_server3.TRPCError({
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
        throw new import_server3.TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not load applications. Please try again in a moment."
        });
      }
    })
  }),
  studio: router({
    list: protectedProcedure.query(async ({ ctx }) => listOwnedStudioForms(ctx.user.id)),
    get: protectedProcedure.input(import_zod4.z.object({ formId: import_zod4.z.number().int().positive() })).query(async ({ ctx, input }) => {
      const result = await getOwnedStudioForm(ctx.user.id, input.formId);
      if (!result) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    create: protectedProcedure.input(studioFormInputSchema).mutation(async ({ ctx, input }) => {
      const formId = await createOwnedStudioForm(ctx.user.id, input);
      return { formId };
    }),
    update: protectedProcedure.input(import_zod4.z.object({ formId: import_zod4.z.number().int().positive(), data: studioFormInputSchema })).mutation(async ({ ctx, input }) => {
      const updated = await updateOwnedStudioForm(ctx.user.id, input.formId, input.data);
      if (!updated) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true };
    }),
    setStatus: protectedProcedure.input(import_zod4.z.object({ formId: import_zod4.z.number().int().positive(), status: import_zod4.z.enum(["draft", "published"]) })).mutation(async ({ ctx, input }) => {
      const updated = await setStudioFormStatus(ctx.user.id, input.formId, input.status);
      if (!updated) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return { success: true };
    }),
    responses: protectedProcedure.input(import_zod4.z.object({ formId: import_zod4.z.number().int().positive() })).query(async ({ ctx, input }) => {
      const responses = await listOwnedStudioResponses(ctx.user.id, input.formId);
      if (!responses) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      return responses;
    }),
    publicGet: publicProcedure.input(import_zod4.z.object({ slug: import_zod4.z.string().min(1).max(140) })).query(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "This form is unavailable." });
      return { form: result.form, questions: result.questions.map(publicQuestion) };
    }),
    submit: publicProcedure.input(import_zod4.z.object({ slug: import_zod4.z.string().min(1).max(140), answers: import_zod4.z.record(import_zod4.z.string(), import_zod4.z.unknown()) })).mutation(async ({ input }) => {
      const result = await getPublishedStudioForm(input.slug);
      if (!result) throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "This form is unavailable." });
      try {
        const answers = validateStudioResponse(result.questions.map(publicQuestion), input.answers);
        await createStudioResponse({ formId: result.form.id, answers: JSON.stringify(answers) });
        return { success: true, redirectUrl: result.form.redirectUrl };
      } catch (error) {
        throw new import_server3.TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Please review your answers." });
      }
    })
  })
});

// api/handler.ts
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use("/api/trpc", (0, import_express2.createExpressMiddleware)({ router: appRouter, createContext }));
var handler_default = app;
