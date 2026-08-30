/**
 * Deterministic candidate quality scoring engine.
 * Score 0-100. Reproducible from application data alone.
 *
 * Breakdown:
 *   Interest Fit       20 pts — Does track align with skills?
 *   Skill Depth        25 pts — Count + quality of skills
 *   Proof of Work      25 pts — Portfolio link present and substantive
 *   Availability       15 pts — Hours/week commitment
 *   Study Year         15 pts — Experience proxy
 */

export type QualityTier =
  | "exceptional"   // 90-100
  | "strong"        // 80-89
  | "potential"     // 70-79
  | "review"        // 60-69
  | "low";          // <60

export interface QualityScoreBreakdown {
  interestFit: number;   // /20
  skillDepth: number;    // /25
  proofOfWork: number;   // /25
  availability: number;  // /15
  studyYear: number;     // /15
  total: number;         // /100
  tier: QualityTier;
}

// Skill sets by category — used for interest fit scoring
const TRACK_CORE_SKILLS: Record<string, string[]> = {
  "Startups & Business": [
    "Business Development", "Market Research", "Strategy", "Partnerships",
    "Excel / Sheets", "PowerPoint / Slides", "Market Research & Analysis",
    "Research & Synthesis", "Strategic Thinking",
  ],
  "Technology & Product": [
    "React", "TypeScript", "Python", "Node.js", "API Integration",
    "Git/GitHub", "AI / LLMs", "Product Thinking", "Web / Coding",
    "Full-Stack Dev", "Mobile Dev", "Dev Tooling",
  ],
  "Creative & Media": [
    "Video Editing", "Motion Graphics", "After Effects", "Premiere Pro",
    "Photography", "3D / Blender", "Illustration", "Graphic Design",
    "Figma (App/Web UI)", "Canva", "AI Image Tools",
  ],
  "Content & Community": [
    "Copywriting", "Content Writing", "Short-form Video (Reels/TikTok)",
    "Community Management", "Email Campaigns", "Social Media Strategy",
    "Newsletter/Blog", "Storytelling",
  ],
  "Explore & Build": [
    "Curious, ready to learn", "Prompt Engineering", "Research & Synthesis",
    "Strategic Thinking", "Business Development",
  ],
};

const HIGH_VALUE_SKILLS = new Set([
  "React", "TypeScript", "Python", "Node.js", "AI / LLMs", "Motion Graphics",
  "After Effects", "Figma (App/Web UI)", "Video Editing", "Full-Stack Dev",
  "Product Thinking", "Market Research & Analysis", "Strategic Thinking",
  "Short-form Video (Reels/TikTok)", "3D / Blender",
]);

function scoreInterestFit(
  track: string,
  skills: string[],
  workAreas: string[]
): number {
  const coreSkills = TRACK_CORE_SKILLS[track] ?? [];
  if (coreSkills.length === 0) return 10; // Unknown track gets neutral score

  const matchCount = skills.filter((s) =>
    coreSkills.some((c) => c.toLowerCase() === s.toLowerCase())
  ).length;

  const workAreaMatch = workAreas.some((w) =>
    coreSkills.some((c) => c.toLowerCase().includes(w.toLowerCase().slice(0, 6)))
  );

  const baseRatio = Math.min(matchCount / Math.max(coreSkills.length * 0.3, 1), 1);
  return Math.round(baseRatio * 16 + (workAreaMatch ? 4 : 0));
}

function scoreSkillDepth(skills: string[]): number {
  if (skills.length === 0) return 0;

  const count = Math.min(skills.length, 10);
  const highValueCount = skills.filter((s) => HIGH_VALUE_SKILLS.has(s)).length;

  // Base: 1 pt per skill up to 8 skills = 8pts, cap at 8
  const countScore = Math.min(count, 8);
  // High-value bonus: up to 12 extra pts (2 pts each, up to 6 high-value skills)
  const hvScore = Math.min(highValueCount * 2, 12);
  // Diversity bonus: 0-5 pts for having skills across different categories
  const diversityBonus = Math.min(Math.floor(count / 3), 5);

  return Math.min(countScore + hvScore + diversityBonus, 25);
}

function scoreProofOfWork(portfolioLink: string | null | undefined, noWorkToShare: boolean): number {
  if (noWorkToShare) return 5; // Acknowledged, gets partial credit
  if (!portfolioLink) return 0;

  const link = portfolioLink.trim().toLowerCase();
  if (link === "" || link === "n/a" || link === "na" || link === "none") return 2;

  // Real links get scored by domain quality
  if (link.includes("github.com")) return 25;
  if (link.includes("behance.net")) return 23;
  if (link.includes("dribbble.com")) return 23;
  if (link.includes("figma.com")) return 22;
  if (link.includes("youtube.com") || link.includes("youtu.be")) return 20;
  if (link.includes("linkedin.com")) return 15;
  if (link.startsWith("http")) return 18; // Generic URL gets good score
  return 8;
}

function scoreAvailability(availabilityHours: string | null | undefined): number {
  if (!availabilityHours) return 5;
  const h = availabilityHours.toLowerCase();
  if (h.includes("20") || h.includes("20+")) return 15;
  if (h.includes("12") || h.includes("12-20")) return 13;
  if (h.includes("8") || h.includes("8-12")) return 11;
  if (h.includes("5") || h.includes("5-8")) return 7;
  return 5;
}

function scoreStudyYear(studyYear: string | null | undefined): number {
  if (!studyYear) return 8;
  const y = studyYear.toLowerCase();
  if (y.includes("3rd") || y.includes("4th") || y.includes("final")) return 15;
  if (y.includes("2nd")) return 13;
  if (y.includes("1st")) return 10;
  return 8;
}

// ---------------------------------------------------------------------------
// Parse tools JSON to extract skills, workAreas etc.
// ---------------------------------------------------------------------------

interface ParsedTools {
  skills: string[];
  workAreas: string[];
  category: string;
  secondaryCategory: string;
  availabilityHours: string;
  noWorkToShare: boolean;
}

export function parseToolsField(rawTools: string): ParsedTools {
  try {
    const parsed = JSON.parse(rawTools);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        workAreas: Array.isArray(parsed.workAreas) ? parsed.workAreas : [],
        category: parsed.category ?? "",
        secondaryCategory: parsed.secondaryCategory ?? "",
        availabilityHours: parsed.availabilityHours ?? "",
        noWorkToShare: Boolean(parsed.noWorkToShare),
      };
    }
    // Legacy: array of strings
    if (Array.isArray(parsed)) {
      return {
        skills: parsed,
        workAreas: [],
        category: "",
        secondaryCategory: "",
        availabilityHours: "",
        noWorkToShare: false,
      };
    }
  } catch {}
  return { skills: [], workAreas: [], category: "", secondaryCategory: "", availabilityHours: "", noWorkToShare: false };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export interface ApplicationForScoring {
  id: number;
  track: string;
  tools: string;
  portfolioLink?: string | null;
  studyYear: string;
}

export function computeQualityScore(app: ApplicationForScoring): QualityScoreBreakdown {
  const parsed = parseToolsField(app.tools);

  const interestFit = scoreInterestFit(app.track, parsed.skills, parsed.workAreas);
  const skillDepth = scoreSkillDepth(parsed.skills);
  const proofOfWork = scoreProofOfWork(app.portfolioLink, parsed.noWorkToShare);
  const availability = scoreAvailability(parsed.availabilityHours);
  const studyYear = scoreStudyYear(app.studyYear);

  const total = Math.min(interestFit + skillDepth + proofOfWork + availability + studyYear, 100);

  let tier: QualityTier;
  if (total >= 90) tier = "exceptional";
  else if (total >= 80) tier = "strong";
  else if (total >= 70) tier = "potential";
  else if (total >= 60) tier = "review";
  else tier = "low";

  return { interestFit, skillDepth, proofOfWork, availability, studyYear, total, tier };
}

export const TIER_LABELS: Record<QualityTier, string> = {
  exceptional: "🔥 Exceptional",
  strong: "⭐ Strong",
  potential: "✅ Potential",
  review: "🟡 Review",
  low: "⚪ Low Priority",
};

export const TIER_COLORS: Record<QualityTier, string> = {
  exceptional: "#dc2626",
  strong: "#2563eb",
  potential: "#059669",
  review: "#d97706",
  low: "#94a3b8",
};
