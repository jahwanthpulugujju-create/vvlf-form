/**
 * Candidate metadata persistence.
 * Stores status, notes, score overrides, and reviewer assignments.
 * Uses a JSON file (data/candidate_meta.json) so it requires no DB migration.
 * Falls back to in-memory if filesystem is read-only (Vercel).
 */

import fs from "fs";
import path from "path";

const META_PATH = path.resolve(process.cwd(), "data/candidate_meta.json");

export type CandidateStatus =
  | "new"
  | "screening"
  | "shortlisted"
  | "challenge_sent"
  | "challenge_done"
  | "interview"
  | "selected"
  | "waitlisted"
  | "rejected"
  | "withdrawn";

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  new: "New",
  screening: "Screening",
  shortlisted: "Shortlisted",
  challenge_sent: "Challenge Sent",
  challenge_done: "Challenge Done",
  interview: "Interview",
  selected: "Selected",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export interface CandidateMeta {
  id: number;
  status: CandidateStatus;
  notes: string;
  scoreOverride?: number;
  reviewer?: string;
  updatedAt: string;
  updatedBy?: string;
}

// In-memory fallback
let inMemoryMeta = new Map<number, CandidateMeta>();
let useMemory = false;

function ensureDir() {
  const dir = path.dirname(META_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAllMeta(): Map<number, CandidateMeta> {
  if (useMemory) return inMemoryMeta;
  try {
    ensureDir();
    if (!fs.existsSync(META_PATH)) return new Map();
    const raw = fs.readFileSync(META_PATH, "utf-8");
    const arr: CandidateMeta[] = JSON.parse(raw);
    return new Map(arr.map((m) => [m.id, m]));
  } catch {
    return new Map();
  }
}

function writeAllMeta(map: Map<number, CandidateMeta>): void {
  if (useMemory) {
    inMemoryMeta = map;
    return;
  }
  try {
    ensureDir();
    fs.writeFileSync(META_PATH, JSON.stringify(Array.from(map.values()), null, 2), "utf-8");
  } catch {
    console.warn("[CandidateMeta] Filesystem is read-only, falling back to memory");
    useMemory = true;
    inMemoryMeta = map;
  }
}

export function getCandidateMeta(id: number): CandidateMeta | undefined {
  return readAllMeta().get(id);
}

export function getAllCandidateMeta(): Map<number, CandidateMeta> {
  return readAllMeta();
}

export function setCandidateMeta(
  id: number,
  updates: Partial<Omit<CandidateMeta, "id" | "updatedAt">>,
  updatedBy?: string
): CandidateMeta {
  const all = readAllMeta();
  const existing = all.get(id) ?? {
    id,
    status: "new" as CandidateStatus,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
  const updated: CandidateMeta = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? existing.updatedBy,
  };
  all.set(id, updated);
  writeAllMeta(all);
  return updated;
}

export function bulkGetMeta(ids: number[]): Map<number, CandidateMeta> {
  const all = readAllMeta();
  const result = new Map<number, CandidateMeta>();
  for (const id of ids) {
    const m = all.get(id);
    if (m) result.set(id, m);
  }
  return result;
}
