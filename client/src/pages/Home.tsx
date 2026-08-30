import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Compass,
  Copy,
  ExternalLink,
  FolderGit2,
  HelpCircle,
  Laptop,
  Layers,
  Lightbulb,
  Link as LinkIcon,
  LockKeyhole,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  TrendingUp,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { trackFunnelEvent } from "@/lib/funnelAnalytics";
import { toast } from "sonner";

const VVLF_LOGO = "/manus-storage/vvlf-logo_4cc3b214.jpg";
const HERO_IMAGE = "/manus-storage/vvlf-student-workspace_dc51b65e.png";
const ABSTRACT_FIELD = "/manus-storage/vvlf-abstract-signal-field_86c3cd10.jpg";
const CAPTION_LOGO = "/manus-storage/vvlf-symbol-logo_015c9f01.png";
const VVLF_WEBSITE_URL = "https://vishnuventurelabs.com/";

// Category Definitions
export const CATEGORIES = [
  {
    id: "Startups & Business",
    title: "STARTUPS & BUSINESS",
    icon: Rocket,
    tagline: "Startups • Research • Strategy • Partnerships",
    description: "Work on market mapping, venture research, strategy, business development, and ecosystem partnerships.",
    workAreas: [
      "Startup Research",
      "Market Research",
      "Strategy",
      "Partnerships",
      "Events",
      "Business Development",
    ],
    skills: [
      "Startup Research",
      "Market Research",
      "Business Analysis",
      "Writing",
      "Presentations",
      "Excel / Sheets",
      "Financial Analysis",
      "Competitive Research",
      "Events",
      "Outreach",
      "Networking",
      "I’m still learning",
    ],
    proofOfWorkExamples: "Research document / analysis / article / pitch deck",
    linkPlaceholder: "https://docs.google.com/... or Notion / article link",
  },
  {
    id: "Technology & Product",
    title: "TECHNOLOGY & PRODUCT",
    icon: Laptop,
    tagline: "Web • Coding • AI • Automation",
    description: "Build web apps, internal tools, AI agents, automation pipelines, and modern digital products.",
    workAreas: [
      "Web Development",
      "Full-Stack Development",
      "AI",
      "Automation",
      "Product Building",
    ],
    skills: [
      "Python",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "HTML/CSS",
      "APIs",
      "Databases",
      "Git/GitHub",
      "AI/LLMs",
      "Automation",
      "I’m still learning",
    ],
    proofOfWorkExamples: "GitHub / deployed project / technical portfolio",
    linkPlaceholder: "https://github.com/... or deployed project link",
  },
  {
    id: "Creative & Media",
    title: "CREATIVE & MEDIA",
    icon: Video,
    tagline: "Design • Video • Motion Graphics • Photography",
    description: "Create visual identities, brand design, UI/UX mockups, cinematic video production, and motion graphics.",
    workAreas: [
      "Graphic Design",
      "UI/UX",
      "Branding",
      "Video Editing",
      "Motion Graphics",
      "Photography",
    ],
    skills: [
      "Graphic Design",
      "Figma",
      "Canva",
      "Photoshop",
      "Illustrator",
      "UI/UX",
      "Video Editing",
      "Premiere Pro",
      "DaVinci Resolve",
      "After Effects",
      "Motion Graphics",
      "Photography",
      "Audio",
      "I’m still learning",
    ],
    proofOfWorkExamples: "Figma / Canva / Behance / portfolio / YouTube / Drive",
    linkPlaceholder: "https://figma.com/... or Behance / YouTube / Drive link",
  },
  {
    id: "Content & Community",
    title: "CONTENT & COMMUNITY",
    icon: TrendingUp,
    tagline: "Social Media • Content • Marketing • Community",
    description: "Drive social media growth, write founder stories, produce viral short-form content, and build founder community.",
    workAreas: [
      "Content Creation",
      "Social Media",
      "Marketing",
      "Community",
      "Outreach",
    ],
    skills: [
      "Copywriting",
      "LinkedIn",
      "Instagram",
      "Content Strategy",
      "Social Media",
      "Marketing",
      "SEO",
      "Community Management",
      "Outreach",
      "Communication",
      "I’m still learning",
    ],
    proofOfWorkExamples: "LinkedIn / article / newsletter / Instagram / campaign",
    linkPlaceholder: "https://linkedin.com/in/... or article / social link",
  },
  {
    id: "Explore & Build",
    title: "EXPLORE & BUILD",
    icon: Compass,
    tagline: "Multiple interests • Still learning • Find your fit",
    description: "Curious, multi-talented, or just getting started? Explore across technology, design, business, and community.",
    workAreas: [
      "I am good at multiple things",
      "I am still learning",
      "I want to try different areas",
      "I am not sure where I fit yet",
    ],
    skills: [
      "Technology",
      "Startups",
      "Design",
      "Media",
      "Content",
      "Community",
      "Events",
      "Business",
      "I’m still learning",
    ],
    proofOfWorkExamples: "Any project, document, Notion page, writeup, or sample",
    linkPlaceholder: "https://... (Optional project or doc link)",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const POPULAR_COLLEGES = [
  "B V Raju Institute of Technology (BVRIT Narsapur)",
  "BVRIT Hyderabad College of Engineering for Women",
  "Vishnu Institute of Technology (VITB Bhimavaram)",
  "Shri Vishnu Engineering College for Women (SVECW)",
  "Other College / University",
];

const STUDY_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

const AVAILABILITY_HOURS = [
  "5–8 hours",
  "8–12 hours",
  "12–20 hours",
  "20+ hours",
] as const;

const AVAILABILITY_DURATIONS = [
  "3 months",
  "6 months",
  "9 months",
  "12+ months",
] as const;

const START_TIMELINES = [
  "Immediately",
  "Within 2 weeks",
  "Within 1 month",
] as const;

const MOTIVATION_GOALS = [
  "Build real projects",
  "Learn new skills",
  "Work with startups",
  "Build my portfolio",
  "Meet founders and mentors",
  "Work on media/content",
  "Explore entrepreneurship",
  "Gain practical experience",
] as const;

interface FormState {
  fullName: string;
  college: string;
  department: string;
  studyYear: "" | (typeof STUDY_YEARS)[number];
  whatsapp: string;
  email: string;
  category: "" | CategoryId;
  secondaryCategory: string;
  workAreas: string[];
  skills: string[];
  proofOfWorkLink: string;
  proofOfWorkLink2: string;
  noWorkToShare: boolean;
  learningInterest: string;
  availabilityHours: (typeof AVAILABILITY_HOURS)[number];
  availabilityDuration: (typeof AVAILABILITY_DURATIONS)[number];
  startTimeline: (typeof START_TIMELINES)[number];
  goals: string[];
  contribution: string;
  consent: boolean;
}

const initialFormState: FormState = {
  fullName: "",
  college: "",
  department: "",
  studyYear: "1st Year",
  whatsapp: "",
  email: "",
  category: "Technology & Product",
  secondaryCategory: "",
  workAreas: ["Web Development", "AI"],
  skills: ["React", "Python", "Git/GitHub"],
  proofOfWorkLink: "",
  proofOfWorkLink2: "",
  noWorkToShare: false,
  learningInterest: "",
  availabilityHours: "8–12 hours",
  availabilityDuration: "6 months",
  startTimeline: "Immediately",
  goals: ["Build real projects", "Build my portfolio"],
  contribution: "",
  consent: false,
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [recommendedRole, setRecommendedRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSecondarySelect, setShowSecondarySelect] = useState(false);
  const [showLink2, setShowLink2] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const submitApplication = trpc.application.submit.useMutation();

  useEffect(() => {
    trackFunnelEvent("landing_view");
  }, []);

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[1];
  }, [form.category]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchFilter = (query: string) => {
    setSearchQuery(query);
    const q = query.toLowerCase().trim();
    if (!q) return;

    trackFunnelEvent("search_query_used", { query: q });

    if (q.includes("motion") || q.includes("video") || q.includes("figma") || q.includes("photo") || q.includes("design") || q.includes("davinci") || q.includes("after effects")) {
      update("category", "Creative & Media");
    } else if (q.includes("react") || q.includes("code") || q.includes("web") || q.includes("python") || q.includes("ai") || q.includes("llm") || q.includes("fullstack")) {
      update("category", "Technology & Product");
    } else if (q.includes("startup") || q.includes("market") || q.includes("research") || q.includes("venture") || q.includes("business") || q.includes("strategy")) {
      update("category", "Startups & Business");
    } else if (q.includes("social") || q.includes("content") || q.includes("instagram") || q.includes("marketing") || q.includes("community") || q.includes("reels") || q.includes("writing")) {
      update("Content & Community" as any, "Content & Community" as any);
      update("category", "Content & Community");
    } else if (q.includes("beginner") || q.includes("learn") || q.includes("explore") || q.includes("all")) {
      update("category", "Explore & Build");
    }
  };

  const toggleWorkArea = (area: string) => {
    setForm((prev) => {
      const updated = prev.workAreas.includes(area)
        ? prev.workAreas.filter((a) => a !== area)
        : [...prev.workAreas, area];
      return { ...prev, workAreas: updated };
    });
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => {
      const updated = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      
      if (fieldErrors.skills) {
        setFieldErrors((e) => ({ ...e, skills: updated.length === 0 ? "Choose at least one skill or 'I’m still learning'." : "" }));
      }
      return { ...prev, skills: updated };
    });
  };

  const toggleGoal = (goal: string) => {
    setForm((prev) => {
      const updated = prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals: updated };
    });
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "fullName":
        if (!String(value || "").trim()) return "Full name is required.";
        if (String(value || "").trim().length < 2) return "Please enter at least 2 characters.";
        return "";
      case "college":
        if (!String(value || "").trim()) return "College or university name is required.";
        return "";
      case "department":
        if (!String(value || "").trim()) return "Department / branch is required (e.g. CSE, ECE).";
        return "";
      case "studyYear":
        if (!value) return "Please select your year of study.";
        return "";
      case "whatsapp":
        if (!String(value || "").trim()) return "WhatsApp number is required.";
        if (!/^\d{10}$/.test(String(value || "").trim())) {
          return "WhatsApp number must be exactly 10 digits (numbers only).";
        }
        return "";
      case "email":
        if (!String(value || "").trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())) {
          return "Please enter a valid email address.";
        }
        return "";
      case "category":
        if (!value) return "Please choose your primary interest area.";
        return "";
      case "skills":
        if (!Array.isArray(value) || value.length === 0) return "Please select at least one skill or 'I’m still learning'.";
        return "";
      case "contribution":
        if (!String(value || "").trim()) return "Please share what you would like to contribute to VVLF.";
        if (String(value || "").trim().length < 2) return "Please enter at least 2 characters.";
        return "";
      case "consent":
        if (!value) return "Please confirm the privacy and consent statement.";
        return "";
      default:
        return "";
    }
  };

  const validateStep = (stepNumber: number): string => {
    const errors: Record<string, string> = {};

    if (stepNumber === 0) {
      const nameErr = validateField("fullName", form.fullName);
      if (nameErr) errors.fullName = nameErr;

      const collegeErr = validateField("college", form.college);
      if (collegeErr) errors.college = collegeErr;

      const deptErr = validateField("department", form.department);
      if (deptErr) errors.department = deptErr;

      const yearErr = validateField("studyYear", form.studyYear);
      if (yearErr) errors.studyYear = yearErr;

      const phoneErr = validateField("whatsapp", form.whatsapp);
      if (phoneErr) errors.whatsapp = phoneErr;

      const emailErr = validateField("email", form.email);
      if (emailErr) errors.email = emailErr;
    } else if (stepNumber === 1) {
      const catErr = validateField("category", form.category);
      if (catErr) errors.category = catErr;

      const skillsErr = validateField("skills", form.skills);
      if (skillsErr) errors.skills = skillsErr;
    } else if (stepNumber === 2) {
      const contribErr = validateField("contribution", form.contribution);
      if (contribErr) errors.contribution = contribErr;

      const consentErr = validateField("consent", form.consent);
      if (consentErr) errors.consent = consentErr;
    }

    setFieldErrors(errors);
    return Object.values(errors)[0] || "";
  };

  const nextStep = () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setError("");
    setFieldErrors({});
    trackFunnelEvent("step_complete", { step: step + 1 });
    setStep((curr) => Math.min(curr + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setError("");
    setStep((curr) => Math.max(curr - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    try {
      setError("");
      const result = await submitApplication.mutateAsync({
        fullName: form.fullName.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        studyYear: form.studyYear as any,
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        category: form.category || "Explore & Build",
        secondaryCategory: form.secondaryCategory || undefined,
        workAreas: form.workAreas,
        skills: form.skills.length > 0 ? form.skills : ["I’m still learning"],
        proofOfWorkLink: form.proofOfWorkLink.trim() || undefined,
        proofOfWorkLink2: form.proofOfWorkLink2.trim() || undefined,
        noWorkToShare: form.noWorkToShare,
        learningInterest: form.learningInterest.trim() || undefined,
        availabilityHours: form.availabilityHours,
        availabilityDuration: form.availabilityDuration,
        startTimeline: form.startTimeline,
        goals: form.goals,
        contribution: form.contribution.trim() || undefined,
        consent: true,
      });

      if (result.recommendedRole) {
        setRecommendedRole(result.recommendedRole);
      }
      trackFunnelEvent("application_submitted", {
        category: form.category,
        recommendedRole: result.recommendedRole,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not save your application. Please try again.");
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast.success("Application link copied to clipboard!");
    trackFunnelEvent("copy_link_clicked");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! VVLF (Vishnu Venture Labs Foundation) has opened applications for their Student Builder Program. You can work across Tech, AI, Design, Media, Startups & Growth (No startup idea required!). Apply here in 1 min: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    trackFunnelEvent("share_whatsapp_clicked");
  };

  const restart = () => {
    setForm(initialFormState);
    setError("");
    setStep(0);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <main
        className="vvlf-page"
        style={{
          backgroundImage: `linear-gradient(rgba(248, 250, 255, 0.94), rgba(255, 252, 249, 0.96)), url(${ABSTRACT_FIELD})`,
        }}
      >
        <section className="thank-you-shell">
          <img className="thank-you-logo" src={VVLF_LOGO} alt="Vishnu Venture Labs Foundation" />
          <div className="thank-you-card panel-enter">
            <div className="success-orbit">
              <CheckCircle2 size={36} strokeWidth={2.4} />
            </div>
            <p className="eyebrow">Application Received</p>
            <h1>You're in the builder funnel.</h1>
            <p className="thank-you-copy">
              Thank you for applying for <strong>{form.category}</strong>. Our team is screening applications and looking for high-curiosity builders.
            </p>

            <div className="no-startup-idea-hero-banner" style={{ textAlign: "left", maxWidth: 520, margin: "0 auto 24px" }}>
              <div className="no-idea-text">
                <strong>NO STARTUP IDEA REQUIRED</strong>
                <p>You'll be working on real venture projects, products, and media with the VVLF team.</p>
              </div>
            </div>

            <div className="thank-you-share-box">
              <h4>Know someone who would be a great fit?</h4>
              <p>Invite friends and classmates who love to code, design, edit videos, or explore.</p>
              <div className="share-buttons">
                <button className="whatsapp-share-btn" type="button" onClick={handleShareWhatsApp}>
                  <Share2 size={16} /> Share on WhatsApp
                </button>
                <button className="copy-link-btn" type="button" onClick={handleCopyLink}>
                  <Copy size={16} /> Copy Application Link
                </button>
              </div>
            </div>

            <div style={{ marginTop: "28px" }}>
              <button className="text-button" type="button" onClick={restart}>
                Submit another application
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const stageTitles = ["About You", "Your Interests & Skills", "Proof of Work & Availability"];

  return (
    <main
      className="vvlf-page"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 255, 0.92), rgba(255, 252, 249, 0.96)), url(${ABSTRACT_FIELD})`,
      }}
    >
      <div className="application-shell">
        {/* Left Side: Brand & Identity Rail */}
        <aside className="identity-rail">
          <div className="logo-plaque">
            <img src={VVLF_LOGO} alt="Vishnu Venture Labs Foundation" />
          </div>

          <p className="rail-kicker">
            <span className="rail-kicker-dot" /> VVLF Student Builder Program
          </p>
          <h1>Find your place at VVLF.</h1>
          <p className="rail-intro">
            Build with a real venture ecosystem. Work on real projects across startups, technology, AI, media, design, growth and partnerships.
          </p>

          <div className="no-idea-badge-sidebar">
            <span>
              <strong>NO STARTUP IDEA REQUIRED</strong>
              No business idea or prior experience needed. Apply in under 60 seconds.
            </span>
          </div>

          <div className="rail-stages" aria-label="Application progress">
            {stageTitles.map((title, index) => (
              <div
                className={`rail-stage ${step === index ? "current" : ""} ${step > index ? "done" : ""}`}
                key={title}
              >
                <span>{step > index ? <Check size={14} /> : `0${index + 1}`}</span>
                <p>{title}</p>
              </div>
            ))}
          </div>

          <div className="rail-visual">
            <img src={HERO_IMAGE} alt="Students building projects at VVLF workspace" />
            <button
              className="visual-caption"
              type="button"
              onClick={() => {
                trackFunnelEvent("about_modal_opened");
                setAboutOpen(true);
              }}
              aria-haspopup="dialog"
            >
              <img src={CAPTION_LOGO} alt="" aria-hidden="true" />
              <span>Turn campus curiosity into real builds. Meet VVLF.</span>
              <CircleHelp size={14} aria-hidden="true" />
            </button>
          </div>
        </aside>

        {/* Right Side: Form Canvas */}
        <section className="form-canvas">
          <header className="canvas-header">
            <div>
              <span className="canvas-overline">VVLF Student Builder Program</span>
              <p>Step {step + 1} of 3 · Open to 1st–3rd year engineering students</p>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
            </div>
            <LockKeyhole size={18} style={{ color: "#64748b" }} aria-label="Secure application" />
          </header>

          <div className="form-inner">
            {/* STEP 1: Quick Personal Information */}
            {step === 0 && (
              <section className="step-panel panel-enter">
                <p className="eyebrow">01 / About You</p>
                <h2>Start your journey with VVLF.</h2>
                <p className="step-intro">
                  Tell us a bit about who you are. This helps us customize opportunities and support for your campus and year.
                </p>

                <div className="no-startup-idea-hero-banner">
                  <div className="no-idea-text">
                    <strong>NO STARTUP IDEA REQUIRED.</strong>
                    <p>
                      You do not need a startup, business idea, previous entrepreneurship experience, or advanced skills to apply.
                    </p>
                  </div>
                </div>

                <div className="field-grid">
                  <label>
                    Full Name *
                    <input
                      className={fieldErrors.fullName ? "input-invalid" : ""}
                      value={form.fullName}
                      onChange={(e) => {
                        update("fullName", e.target.value);
                        if (fieldErrors.fullName) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            fullName: validateField("fullName", e.target.value),
                          }));
                        }
                      }}
                      placeholder="e.g. Rahul Sharma"
                    />
                    {fieldErrors.fullName && (
                      <span className="field-error-text">{fieldErrors.fullName}</span>
                    )}
                  </label>

                  <label>
                    College / University *
                    <input
                      className={fieldErrors.college ? "input-invalid" : ""}
                      value={form.college}
                      onChange={(e) => {
                        update("college", e.target.value);
                        if (fieldErrors.college) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            college: validateField("college", e.target.value),
                          }));
                        }
                      }}
                      placeholder="e.g. BVRIT, SVECW, VIT, CBIT, JNTU..."
                    />
                    {fieldErrors.college && (
                      <span className="field-error-text">{fieldErrors.college}</span>
                    )}
                  </label>

                  <label>
                    Department / Branch *
                    <input
                      className={fieldErrors.department ? "input-invalid" : ""}
                      value={form.department}
                      onChange={(e) => {
                        update("department", e.target.value);
                        if (fieldErrors.department) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            department: validateField("department", e.target.value),
                          }));
                        }
                      }}
                      placeholder="e.g. CSE, ECE, IT, AIDS, Mechanical..."
                    />
                    {fieldErrors.department && (
                      <span className="field-error-text">{fieldErrors.department}</span>
                    )}
                  </label>

                  <label>
                    Year of Study *
                    <select
                      className={fieldErrors.studyYear ? "input-invalid" : ""}
                      value={form.studyYear}
                      onChange={(e) => {
                        update("studyYear", e.target.value as any);
                        if (fieldErrors.studyYear) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            studyYear: validateField("studyYear", e.target.value),
                          }));
                        }
                      }}
                    >
                      {STUDY_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.studyYear && (
                      <span className="field-error-text">{fieldErrors.studyYear}</span>
                    )}
                  </label>

                  <label>
                    WhatsApp Number *
                    <input
                      className={fieldErrors.whatsapp ? "input-invalid" : ""}
                      value={form.whatsapp}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        update("whatsapp", digits);
                        if (fieldErrors.whatsapp) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            whatsapp: validateField("whatsapp", digits),
                          }));
                        }
                      }}
                      placeholder="10-digit mobile number"
                    />
                    <div className="field-hint-text">
                      {fieldErrors.whatsapp ? (
                        <span className="field-error-text" style={{ margin: 0 }}>
                          {fieldErrors.whatsapp}
                        </span>
                      ) : (
                        <span>For direct updates &amp; invitations</span>
                      )}
                      <span>{form.whatsapp.length}/10</span>
                    </div>
                  </label>

                  <label>
                    Email Address *
                    <input
                      className={fieldErrors.email ? "input-invalid" : ""}
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        update("email", e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            email: validateField("email", e.target.value),
                          }));
                        }
                      }}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <span className="field-error-text">{fieldErrors.email}</span>
                    )}
                  </label>
                </div>
              </section>
            )}

            {/* STEP 2: Choose What Interests You */}
            {step === 1 && (
              <section className="step-panel panel-enter">
                <p className="eyebrow">02 / What do you want to work on?</p>
                <h2>Choose the area that sounds most interesting.</h2>
                <p className="step-intro">
                  Pick what you're curious about. You do not need prior experience to join.
                </p>

                {/* Optional Quick Search */}
                <div className="search-pill-container">
                  <div className="search-input-wrapper">
                    <Search size={16} style={{ color: "#64748b" }} />
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearchFilter(e.target.value)}
                      placeholder="Looking for something specific? (e.g. Motion Graphics, React, AI, Events...)"
                    />
                  </div>
                  <div className="quick-search-tags">
                    <small>Quick filters:</small>
                    {["React / Web", "Motion Graphics", "AI / Automation", "Startup Research", "Canva / Figma", "Social Growth"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="tag-btn"
                        onClick={() => handleSearchFilter(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5 Primary Opportunity Cards */}
                <div className="category-cards-grid">
                  {CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-card ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          update("category", cat.id);
                          trackFunnelEvent("category_selected", { category: cat.id });
                          if (fieldErrors.category) {
                            setFieldErrors((prev) => ({ ...prev, category: "" }));
                          }
                        }}
                      >
                        <div className="category-card-top">
                          <span className="category-icon">
                            <IconComponent size={24} style={{ color: isSelected ? "#2563eb" : "#475569" }} />
                          </span>
                          <span className="category-check-indicator">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        </div>
                        <h3>{cat.title}</h3>
                        <span className="category-tags">{cat.tagline}</span>
                        <p>{cat.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Category Option */}
                <div className="secondary-category-box">
                  <div
                    className="secondary-category-header"
                    onClick={() => setShowSecondarySelect(!showSecondarySelect)}
                  >
                    <p>Interested in more than one area? (Optional)</p>
                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 700 }}>
                      {showSecondarySelect ? "Hide ▲" : "Select secondary ▼"}
                    </span>
                  </div>
                  {showSecondarySelect && (
                    <div className="secondary-chips">
                      {CATEGORIES.filter((c) => c.id !== form.category).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`secondary-chip ${form.secondaryCategory === c.id ? "selected" : ""}`}
                          onClick={() => {
                            const newSec = form.secondaryCategory === c.id ? "" : c.id;
                            update("secondaryCategory", newSec);
                            if (newSec) trackFunnelEvent("secondary_category_selected", { secondary: newSec });
                          }}
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Work Areas */}
                <fieldset className="choice-fieldset">
                  <legend>What would you enjoy doing in {activeCategory.id}? (Select any)</legend>
                  <div className="skills-chip-grid">
                    {activeCategory.workAreas.map((area) => {
                      const isSelected = form.workAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          className={`skill-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleWorkArea(area)}
                        >
                          {isSelected ? <Check size={14} /> : "+"} {area}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Specific Skills Chips */}
                <fieldset className="choice-fieldset">
                  <legend>Select relevant skills or tools (Select all that apply) *</legend>
                  {fieldErrors.skills && (
                    <span className="field-error-text" style={{ marginBottom: 8 }}>
                      {fieldErrors.skills}
                    </span>
                  )}
                  <div className="skills-chip-grid">
                    {activeCategory.skills.map((skill) => {
                      const isSelected = form.skills.includes(skill);
                      const isLearning = skill === "I’m still learning";
                      return (
                        <button
                          key={skill}
                          type="button"
                          className={`skill-chip ${isSelected ? "selected" : ""} ${isLearning ? "skill-chip-learning" : ""}`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {isSelected ? <Check size={14} /> : "+"} {skill}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="trust-line" style={{ marginTop: 24 }}>
                  <Lightbulb size={17} />
                  <span>
                    <strong>New to this? That's completely okay.</strong> You can apply even if you're still learning. No prior startup experience required.
                  </span>
                </div>
              </section>
            )}

            {/* STEP 3: Proof of Work & Availability */}
            {step === 2 && (
              <section className="step-panel panel-enter">
                <p className="eyebrow">03 / Proof of Work &amp; Availability</p>
                <h2>Show us something you've built.</h2>
                <p className="step-intro">
                  A portfolio isn't required, but relevant proof of work helps us understand your strengths and current experience.
                </p>

                {/* Dynamic Proof of Work Card */}
                <div className="pow-card">
                  <div className="pow-header">
                    <div className="pow-header-icon">
                      <LinkIcon size={18} />
                    </div>
                    <div>
                      <h3>Proof of Work (Optional)</h3>
                      <p>Share a link to something you've worked on, designed, coded, or written.</p>
                    </div>
                  </div>

                  <div className="pow-dynamic-examples-badge">
                    <Layers size={14} />
                    <span>
                      <strong>Suggested for {activeCategory.id}:</strong> {activeCategory.proofOfWorkExamples}
                    </span>
                  </div>

                  {!form.noWorkToShare ? (
                    <div className="pow-inputs">
                      <label className="link-label" style={{ margin: 0 }}>
                        Project or Profile Link
                        <input
                          value={form.proofOfWorkLink}
                          onChange={(e) => update("proofOfWorkLink", e.target.value)}
                          placeholder={activeCategory.linkPlaceholder}
                        />
                      </label>

                      {showLink2 ? (
                        <label className="link-label" style={{ margin: 0 }}>
                          Additional Link (Optional)
                          <input
                            value={form.proofOfWorkLink2}
                            onChange={(e) => update("proofOfWorkLink2", e.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          className="text-button"
                          style={{ margin: 0, padding: 0, alignSelf: "flex-start", background: "none", color: "#2563eb", fontSize: "12px", fontWeight: 700 }}
                          onClick={() => setShowLink2(true)}
                        >
                          + Add a second link
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      <label className="custom-label">
                        Tell us what you'd like to learn or build at VVLF:
                        <input
                          className="custom-textarea"
                          value={form.learningInterest}
                          onChange={(e) => update("learningInterest", e.target.value)}
                          placeholder="e.g. I want to build AI agents, master Figma UI design, or learn startup research..."
                        />
                      </label>
                    </div>
                  )}

                  <label className="pow-no-work-toggle">
                    <input
                      type="checkbox"
                      checked={form.noWorkToShare}
                      onChange={(e) => {
                        update("noWorkToShare", e.target.checked);
                        if (e.target.checked) {
                          trackFunnelEvent("proof_of_work_skipped");
                        } else {
                          trackFunnelEvent("proof_of_work_provided");
                        }
                      }}
                    />
                    <span>I don't have anything to share yet (That's completely fine!)</span>
                  </label>
                </div>

                {/* Availability Section */}
                <fieldset className="choice-fieldset">
                  <legend>How much time can you realistically contribute each week?</legend>
                  <div className="choice-grid">
                    {AVAILABILITY_HOURS.map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        className={`choice-card ${form.availabilityHours === hours ? "selected" : ""}`}
                        onClick={() => update("availabilityHours", hours)}
                      >
                        {hours}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="choice-fieldset">
                  <legend>How long can you contribute?</legend>
                  <div className="choice-grid">
                    {AVAILABILITY_DURATIONS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        className={`choice-card ${form.availabilityDuration === dur ? "selected" : ""}`}
                        onClick={() => update("availabilityDuration", dur)}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Motivation Chips */}
                <fieldset className="choice-fieldset">
                  <legend>What are you hoping to get from VVLF? (Select all that apply)</legend>
                  <div className="skills-chip-grid">
                    {MOTIVATION_GOALS.map((goal) => {
                      const isSelected = form.goals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          className={`skill-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleGoal(goal)}
                        >
                          {isSelected ? <Check size={14} /> : "+"} {goal}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Mandatory Contribution */}
                <div style={{ marginTop: 24 }}>
                  <label className="custom-label">
                    What would you like to contribute to VVLF? * (Max 200 chars)
                    <input
                      className={`custom-textarea ${fieldErrors.contribution ? "input-invalid" : ""}`}
                      maxLength={200}
                      value={form.contribution}
                      onChange={(e) => {
                        update("contribution", e.target.value);
                        if (fieldErrors.contribution) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            contribution: validateField("contribution", e.target.value),
                          }));
                        }
                      }}
                      placeholder="e.g. I can help build frontend UI, edit short videos, or write tech guides..."
                    />
                    {fieldErrors.contribution && (
                      <span className="field-error-text">{fieldErrors.contribution}</span>
                    )}
                    <div className="field-hint-text">
                      <span>Briefly describe your enthusiasm or niche strengths</span>
                      <span>{form.contribution.length}/200</span>
                    </div>
                  </label>
                </div>

                {/* Compact Application Review Box */}
                <div className="review-card">
                  <div className="review-card-header">
                    <strong>Application Summary</strong>
                    <button type="button" className="edit-btn" onClick={() => setStep(1)}>
                      Edit Interests
                    </button>
                  </div>
                  <div className="review-row">
                    <span>Applicant</span>
                    <span>{form.fullName || "—"} ({form.studyYear})</span>
                  </div>
                  <div className="review-row">
                    <span>Primary Area</span>
                    <span>{form.category}</span>
                  </div>
                  <div className="review-row">
                    <span>Selected Skills</span>
                    <span>{form.skills.length > 0 ? form.skills.join(", ") : "Still learning"}</span>
                  </div>
                  <div className="review-row">
                    <span>Weekly Commitment</span>
                    <span>{form.availabilityHours}</span>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="consent">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={(e) => {
                      update("consent", e.target.checked);
                      if (fieldErrors.consent) {
                        setFieldErrors((prev) => ({ ...prev, consent: "" }));
                      }
                    }}
                  />
                  <span>
                    <strong>Privacy notice and consent *</strong>
                    <br />
                    I confirm that my details are accurate. I agree that VVLF may securely use my contact details solely to review my application and communicate regarding the Student Builder Program.
                  </span>
                </label>
                {fieldErrors.consent && (
                  <span className="field-error-text" style={{ marginLeft: 8 }}>
                    {fieldErrors.consent}
                  </span>
                )}
              </section>
            )}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <footer className="form-footer">
            <button
              className="secondary-action"
              type="button"
              disabled={step === 0 || submitApplication.isPending}
              onClick={prevStep}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {step < 2 ? (
              <button className="primary-action" type="button" onClick={nextStep}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="primary-action"
                type="button"
                disabled={submitApplication.isPending}
                onClick={submit}
              >
                {submitApplication.isPending ? "Submitting Application…" : "Submit Application"}{" "}
                {!submitApplication.isPending && <ArrowRight size={16} />}
              </button>
            )}
          </footer>
        </section>
      </div>

      {/* About VVLF Modal */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="vvlf-about-dialog">
          <DialogHeader className="vvlf-about-header">
            <div className="vvlf-about-brand">
              <img src={CAPTION_LOGO} alt="" aria-hidden="true" />
              <span>VVLF / Incubation Ecosystem</span>
            </div>
            <DialogTitle className="vvlf-about-title">
              From campus curiosity to real-world ventures.
            </DialogTitle>
            <DialogDescription className="vvlf-about-copy">
              Vishnu Venture Labs Foundation (VVLF) is the premier incubation center at BVRIT Narsapur, enabling students and early-stage innovators to build real products, launch startups, and master high-demand skills across engineering, design, and venture building.
            </DialogDescription>
          </DialogHeader>

          <div className="vvlf-about-points" aria-label="VVLF Pillars">
            <span>🚀 Venture Scouting</span>
            <span>💻 Full-Stack &amp; AI</span>
            <span>🎨 Brand &amp; Media</span>
            <span>📈 Growth &amp; Community</span>
          </div>

          <DialogFooter className="vvlf-about-actions">
            <DialogClose asChild>
              <button className="about-secondary-action" type="button">
                Continue Application
              </button>
            </DialogClose>
            <a
              className="about-primary-link"
              href={VVLF_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore VVLF Website <ExternalLink size={14} aria-hidden="true" />
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
