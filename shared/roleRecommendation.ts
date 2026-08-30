/**
 * VVLF Internal Role Architecture & Recommendation Engine
 * Maps student-friendly 5 categories and skills to the 12 internal VVLF roles.
 */

export const VVLF_INTERNAL_ROLES = [
  "Venture Intelligence & Strategy Intern",
  "Venture Scouting & Market Research Intern",
  "Strategic Partnerships & Ecosystem Intern",
  "Commercial & Institutional Partnerships Intern",
  "Founder Success & Community Intern",
  "Digital Product & Full-Stack Engineering Intern",
  "AI & Automation Engineering Intern",
  "Creative Brand & Visual Communications Intern",
  "Cinematic Media Production Intern",
  "Video, Motion & Post-Production Intern",
  "Content, Growth & Distribution Intern",
  "Short-Form & Social Media Growth Intern",
] as const;

export type VvlfInternalRole = (typeof VVLF_INTERNAL_ROLES)[number];

export interface RoleMappingInput {
  category: string;
  secondaryCategory?: string;
  workAreas?: string[];
  skills?: string[];
  proofOfWorkLink?: string;
  learningInterest?: string;
}

export function recommendInternalRole(input: RoleMappingInput): VvlfInternalRole {
  const { category, workAreas = [], skills = [] } = input;
  const combinedText = [...workAreas, ...skills].join(" ").toLowerCase();

  switch (category) {
    case "Technology & Product": {
      if (
        combinedText.includes("ai") ||
        combinedText.includes("llm") ||
        combinedText.includes("automation") ||
        combinedText.includes("python")
      ) {
        return "AI & Automation Engineering Intern";
      }
      return "Digital Product & Full-Stack Engineering Intern";
    }

    case "Creative & Media": {
      if (
        combinedText.includes("motion graphics") ||
        combinedText.includes("after effects") ||
        combinedText.includes("video editing") ||
        combinedText.includes("premiere") ||
        combinedText.includes("davinci")
      ) {
        return "Video, Motion & Post-Production Intern";
      }
      if (
        combinedText.includes("photography") ||
        combinedText.includes("cinematic") ||
        combinedText.includes("audio") ||
        combinedText.includes("camera")
      ) {
        return "Cinematic Media Production Intern";
      }
      return "Creative Brand & Visual Communications Intern";
    }

    case "Startups & Business": {
      if (
        combinedText.includes("commercial") ||
        combinedText.includes("institutional") ||
        combinedText.includes("sponsorship") ||
        combinedText.includes("business development")
      ) {
        return "Commercial & Institutional Partnerships Intern";
      }
      if (
        combinedText.includes("partnerships") ||
        combinedText.includes("ecosystem") ||
        combinedText.includes("events") ||
        combinedText.includes("networking")
      ) {
        return "Strategic Partnerships & Ecosystem Intern";
      }
      if (
        combinedText.includes("market research") ||
        combinedText.includes("startup research") ||
        combinedText.includes("competitive research")
      ) {
        return "Venture Scouting & Market Research Intern";
      }
      return "Venture Intelligence & Strategy Intern";
    }

    case "Content & Community": {
      if (
        combinedText.includes("social media") ||
        combinedText.includes("instagram") ||
        combinedText.includes("short-form") ||
        combinedText.includes("reels")
      ) {
        return "Short-Form & Social Media Growth Intern";
      }
      if (
        combinedText.includes("community") ||
        combinedText.includes("founder success") ||
        combinedText.includes("peer outreach")
      ) {
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
