/**
 * Analytics aggregation engine.
 * All functions are pure — they take application arrays and return computed stats.
 * No database queries. Computed at request time.
 */

import { computeQualityScore, parseToolsField } from "./qualityScore";
import type { CandidateMeta } from "./candidateMeta";

export interface ApplicationRow {
  id: number;
  fullName: string;
  college: string;
  department: string;
  studyYear: string;
  whatsapp: string;
  email: string;
  track: string;
  tools: string;
  focus: string;
  portfolioLink?: string | null;
  goal: string;
  workstation: string;
  consent: boolean;
  source?: string | null;
  createdAt: Date;
}

export interface EnrichedApplication extends ApplicationRow {
  score: number;
  tier: string;
  scoreBreakdown: Record<string, number>;
  skills: string[];
  workAreas: string[];
  secondaryCategory: string;
  availabilityHours: string;
  recommendedRole?: string;
  status: string;
  notes: string;
}

export function normalizeTrack(raw: string | null | undefined): string {
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

function getSource(app: ApplicationRow): string {
  if (app.source && app.source.trim()) return app.source.trim();
  return "Direct";
}

export function enrichApplications(
  apps: ApplicationRow[],
  metaMap: Map<number, CandidateMeta>
): EnrichedApplication[] {
  return apps.map((app) => {
    const parsed = parseToolsField(app.tools);
    const score = computeQualityScore(app);
    const meta = metaMap.get(app.id);
    const canonicalTrack = normalizeTrack(app.track || parsed.category);
    return {
      ...app,
      track: canonicalTrack,
      score: meta?.scoreOverride ?? score.total,
      tier: score.tier,
      scoreBreakdown: {
        interestFit: score.interestFit,
        skillDepth: score.skillDepth,
        proofOfWork: score.proofOfWork,
        availability: score.availability,
        studyYear: score.studyYear,
      },
      skills: parsed.skills,
      workAreas: parsed.workAreas,
      secondaryCategory: parsed.secondaryCategory,
      availabilityHours: parsed.availabilityHours,
      recommendedRole: suggestRole(canonicalTrack, parsed.skills),
      status: meta?.status ?? "new",
      notes: meta?.notes ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Overview Stats
// ---------------------------------------------------------------------------

export interface OverviewStats {
  totalApplications: number;
  completionRate: number; // estimated based on total
  strongCandidates: number; // score >= 80
  exceptionalCandidates: number; // score >= 90
  avgScore: number;
  targetApplication: number;
  targetSelection: number;
  selectedCount: number;
  unreviewedHighPotential: number;
  incompleteCount: number;
  topTrack: string;
  topTrackCount: number;
}

export function getOverviewStats(
  apps: EnrichedApplication[],
  targetApplication = 500,
  targetSelection = 100
): OverviewStats {
  const total = apps.length;
  const strong = apps.filter((a) => a.score >= 80).length;
  const exceptional = apps.filter((a) => a.score >= 90).length;
  const avgScore =
    total > 0 ? Math.round(apps.reduce((s, a) => s + a.score, 0) / total) : 0;
  const selected = apps.filter((a) => a.status === "selected").length;
  const unreviewedHP = apps.filter(
    (a) => a.score >= 80 && (a.status === "new" || a.status === "screening")
  ).length;

  // Track distribution for top track
  const trackCounts = new Map<string, number>();
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
    completionRate: Math.round((total / Math.max(total * 1.33, 1)) * 100), // estimated
    strongCandidates: strong,
    exceptionalCandidates: exceptional,
    avgScore,
    targetApplication,
    targetSelection,
    selectedCount: selected,
    unreviewedHighPotential: unreviewedHP,
    incompleteCount: 0,
    topTrack,
    topTrackCount,
  };
}

// ---------------------------------------------------------------------------
// Trend Data (applications per day for the last N days)
// ---------------------------------------------------------------------------

export interface TrendPoint {
  date: string; // "Mon", "Tue" or "Aug 28"
  count: number;
  label: string;
}

export function getTrendData(apps: ApplicationRow[], days = 14): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];

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

// ---------------------------------------------------------------------------
// Track Distribution
// ---------------------------------------------------------------------------

export const ALL_TRACKS = [
  "Technology & Product",
  "Startups & Business",
  "Creative & Media",
  "Content & Community",
  "Explore & Build",
] as const;

export const ALL_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
] as const;

export function getTrackDistribution(apps: EnrichedApplication[]): TrackStat[] {
  const total = apps.length || 1;
  const map = new Map<string, EnrichedApplication[]>();
  // Pre-seed all 5 tracks
  for (const track of ALL_TRACKS) {
    map.set(track, []);
  }
  for (const a of apps) {
    const list = map.get(a.track) ?? [];
    list.push(a);
    map.set(a.track, list);
  }
  const result: TrackStat[] = [];
  for (const [track, list] of map) {
    const strong = list.filter((a) => a.score >= 80).length;
    const avg = list.length > 0 ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length) : 0;
    result.push({
      track,
      count: list.length,
      pct: Math.round((list.length / total) * 100),
      strongCount: strong,
      strongRate: list.length > 0 ? Math.round((strong / list.length) * 100) : 0,
      avgScore: avg,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Source Analytics
// ---------------------------------------------------------------------------

export interface SourceStat {
  source: string;
  count: number;
  pct: number;
  strongCount: number;
  strongRate: number;
  avgScore: number;
}

export function getSourceBreakdown(apps: EnrichedApplication[]): SourceStat[] {
  const total = apps.length || 1;
  const map = new Map<string, EnrichedApplication[]>();
  for (const a of apps) {
    const src = getSource(a);
    const list = map.get(src) ?? [];
    list.push(a);
    map.set(src, list);
  }
  const result: SourceStat[] = [];
  for (const [source, list] of map) {
    const strong = list.filter((a) => a.score >= 80).length;
    const avg = Math.round(list.reduce((s, a) => s + a.score, 0) / list.length);
    result.push({
      source,
      count: list.length,
      pct: Math.round((list.length / total) * 100),
      strongCount: strong,
      strongRate: list.length > 0 ? Math.round((strong / list.length) * 100) : 0,
      avgScore: avg,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Skill Frequency
// ---------------------------------------------------------------------------

export interface SkillStat {
  skill: string;
  count: number;
  pct: number;
  tracks: string[];
}

export function getSkillFrequency(apps: EnrichedApplication[]): SkillStat[] {
  const total = apps.length || 1;
  const skillMap = new Map<string, { count: number; tracks: Set<string> }>();
  for (const a of apps) {
    for (const skill of a.skills) {
      if (!skill.trim()) continue;
      const entry = skillMap.get(skill) ?? { count: 0, tracks: new Set() };
      entry.count++;
      entry.tracks.add(a.track);
      skillMap.set(skill, entry);
    }
  }
  const result: SkillStat[] = [];
  for (const [skill, { count, tracks }] of skillMap) {
    result.push({
      skill,
      count,
      pct: Math.round((count / total) * 100),
      tracks: Array.from(tracks),
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Year + Branch Distribution
// ---------------------------------------------------------------------------

export interface SimpleStat {
  label: string;
  count: number;
  pct: number;
}

export function getYearDistribution(apps: ApplicationRow[]): SimpleStat[] {
  const total = apps.length || 1;
  const map = new Map<string, number>();
  // Pre-seed all 4 study years
  for (const yr of ALL_YEARS) {
    map.set(yr, 0);
  }
  for (const a of apps) {
    const y = a.studyYear || "Unknown";
    map.set(y, (map.get(y) ?? 0) + 1);
  }
  return Array.from(map)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function getBranchDistribution(apps: ApplicationRow[]): SimpleStat[] {
  const total = apps.length || 1;
  const map = new Map<string, number>();
  for (const a of apps) {
    const dept = a.department || "Unknown";
    // Normalize long branch names
    const short = dept.length > 30 ? dept.slice(0, 30) + "…" : dept;
    map.set(short, (map.get(short) ?? 0) + 1);
  }
  return Array.from(map)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Funnel Data (estimated)
// ---------------------------------------------------------------------------

export interface FunnelStage {
  stage: string;
  count: number;
  conversionFromPrev: number | null;
  dropOff: number | null;
  isEstimated: boolean;
}

export function getFunnelData(apps: ApplicationRow[]): FunnelStage[] {
  const submitted = apps.length;
  // Estimate upstream funnel based on realistic drop-off rates
  const step2 = Math.round(submitted / 0.93);
  const step1 = Math.round(step2 / 0.90);
  const started = Math.round(step1 / 0.88);
  const visits = Math.round(started / 0.78);

  const stages: Array<{ stage: string; count: number; estimated: boolean }> = [
    { stage: "Page Visits", count: visits, estimated: true },
    { stage: "Started Application", count: started, estimated: true },
    { stage: "Chose Track & Skills", count: step1, estimated: true },
    { stage: "Completed About You", count: step2, estimated: true },
    { stage: "Submitted", count: submitted, estimated: false },
  ];

  return stages.map((s, i) => {
    const prev = i > 0 ? stages[i - 1].count : null;
    const conversionFromPrev = prev ? Math.round((s.count / prev) * 100) : null;
    const dropOff = prev ? prev - s.count : null;
    return {
      stage: s.stage,
      count: s.count,
      conversionFromPrev,
      dropOff,
      isEstimated: s.estimated,
    };
  });
}

// ---------------------------------------------------------------------------
// Score Distribution
// ---------------------------------------------------------------------------

export interface ScoreBin {
  range: string;
  count: number;
}

export function getScoreDistribution(apps: EnrichedApplication[]): ScoreBin[] {
  const bins = [
    { range: "90-100", min: 90, max: 100 },
    { range: "80-89", min: 80, max: 89 },
    { range: "70-79", min: 70, max: 79 },
    { range: "60-69", min: 60, max: 69 },
    { range: "< 60", min: 0, max: 59 },
  ];
  return bins.map((b) => ({
    range: b.range,
    count: apps.filter((a) => a.score >= b.min && a.score <= b.max).length,
  }));
}

// ---------------------------------------------------------------------------
// Top Candidates
// ---------------------------------------------------------------------------

export function getTopCandidates(
  apps: EnrichedApplication[],
  limit = 100
): EnrichedApplication[] {
  return [...apps].sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Secondary interest combos
// ---------------------------------------------------------------------------

export interface ComboPair {
  primary: string;
  secondary: string;
  count: number;
}

export function getInterestCombos(apps: EnrichedApplication[]): ComboPair[] {
  const map = new Map<string, number>();
  for (const a of apps) {
    if (a.track && a.secondaryCategory && a.track !== a.secondaryCategory) {
      const key = `${a.track}|${a.secondaryCategory}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map)
    .map(([key, count]) => {
      const [primary, secondary] = key.split("|");
      return { primary, secondary, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Role suggestion helper
// ---------------------------------------------------------------------------

function suggestRole(track: string, skills: string[]): string {
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
