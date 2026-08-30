import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import fs from "fs";
import path from "path";

const ADMIN_COOKIE_NAME = "vvlf_admin_session";
const SALT_ROUNDS = 10;
const SESSION_EXPIRY_HOURS = 8;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiter: IP → { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export { ADMIN_COOKIE_NAME };

// ---------------------------------------------------------------------------
// Admin account types
// ---------------------------------------------------------------------------

export interface AdminAccount {
  username: string;
  passwordHash: string;
  displayName: string;
  role: "owner" | "admin" | "reviewer";
  active: boolean;
}

// ---------------------------------------------------------------------------
// Load admin accounts from environment
// ---------------------------------------------------------------------------

export function getAdminAccounts(): AdminAccount[] {
  // Try ADMIN_ACCOUNTS first (JSON array of accounts)
  if (process.env.ADMIN_ACCOUNTS) {
    try {
      const parsed = JSON.parse(process.env.ADMIN_ACCOUNTS);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      console.warn("[AdminAuth] ADMIN_ACCOUNTS env is not valid JSON");
    }
  }

  // Fall back to single admin env vars (with default fallback if unset)
  const username = process.env.ADMIN_USERNAME || "admin";
  const passwordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    "$2b$10$oOBL75mo84LS0u3UfDoGQugBDreEClao3StuJ9J53G9jD5vi96TKO"; // default hash for vvlf2024!
  
  return [
    {
      username,
      passwordHash,
      displayName: process.env.ADMIN_DISPLAY_NAME || "VVLF Administrator",
      role: "owner",
      active: true,
    },
  ];
}

export function findAdminByUsername(username: string): AdminAccount | undefined {
  return getAdminAccounts().find(
    (a) => a.active && a.username.toLowerCase() === username.toLowerCase()
  );
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// JWT session tokens
// ---------------------------------------------------------------------------

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "vvlf-admin-secret-change-in-production";
  return new TextEncoder().encode(`admin:${secret}`);
}

export async function createAdminSession(username: string, role: string): Promise<string> {
  return new SignJWT({ username, role, type: "admin_session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_HOURS}h`)
    .setSubject(`admin:${username}`)
    .sign(getJwtSecret());
}

export async function verifyAdminSession(
  token: string
): Promise<{ username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      payload.type === "admin_session" &&
      typeof payload.username === "string" &&
      typeof payload.role === "string"
    ) {
      return { username: payload.username, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
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

export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

const AUDIT_LOG_PATH = path.resolve(process.cwd(), "data/audit_log.json");

export interface AuditEntry {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  target?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

function ensureAuditDir() {
  const dir = path.dirname(AUDIT_LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function writeAuditLog(entry: Omit<AuditEntry, "id" | "timestamp">): void {
  try {
    ensureAuditDir();
    let log: AuditEntry[] = [];
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      try {
        log = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, "utf-8"));
      } catch {}
    }
    const full: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    log.unshift(full);
    // Keep last 2000 entries
    if (log.length > 2000) log = log.slice(0, 2000);
    fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuditLog] Could not write:", err);
  }
}

export function readAuditLog(limit = 200): AuditEntry[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) return [];
    const log: AuditEntry[] = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, "utf-8"));
    return log.slice(0, limit);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function getAdminCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
  };
}
