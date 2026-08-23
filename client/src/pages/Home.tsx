import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, ExternalLink, LockKeyhole, Sparkles } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { trackCaptionEngagement } from "@/lib/captionAnalytics";
import { remainingRequiredPrompts } from "@/lib/applicationProgress";

const VVLF_LOGO = "/manus-storage/vvlf-logo_4cc3b214.jpg";
const HERO_IMAGE = "/manus-storage/vvlf-student-workspace_dc51b65e.png";
const ABSTRACT_FIELD = "/manus-storage/vvlf-abstract-signal-field_86c3cd10.jpg";
const WORKBENCH_IMAGE = HERO_IMAGE;
const CAPTION_LOGO = "/manus-storage/vvlf-symbol-logo_015c9f01.png";
const VVLF_WEBSITE_URL = "https://vishnuventurelabs.com/";

// Applicants briefly see the confirmed state, then continue to VVLF's primary website.
const POST_SUBMISSION_REDIRECT_URL = "https://vishnuventurelabs.com/";
const REDIRECT_DELAY_MS = 1200;

const tracks = [
  {
    id: "Design & Visuals",
    summary: "Canva, Figma, posters, slide decks, and visual communication.",
    tools: ["Canva / Presentation Slides", "Figma (App/Web UI)", "Adobe Photoshop / Illustrator", "AI Image Tools"],
    focusPrompt: "When working on a graphic or slide, what do you focus on first?",
    focus: ["Clean alignment & spacing", "Choosing a good color scheme", "Clear, readable fonts", "Starting with a pre-built template"],
    linkHint: "Share a Canva link, Drive folder, or design page if you have one.",
  },
  {
    id: "Video & Media",
    summary: "Reels, editing, YouTube, short-form storytelling, and motion.",
    tools: ["Mobile Editors (CapCut, VN, InShot)", "Desktop Editors (Premiere Pro, DaVinci)", "Motion Graphics", "Audio Cleanup Tools"],
    focusPrompt: "In short video edits, what grabs your attention most?",
    focus: ["Fast pacing & quick cuts", "High-energy background audio", "A strong visual hook", "Clean on-screen subtitles"],
    linkHint: "Share an Instagram Reel, YouTube link, or Drive folder if you have one.",
  },
  {
    id: "Tech & Web",
    summary: "Coding, web development, Python, and no-code tools.",
    tools: ["Web Basics (HTML/CSS/JS)", "Modern Web (React, Next.js, Tailwind)", "Python / Logic Building", "No-Code Builders (Framer, Webflow)", "Git & GitHub"],
    focusPrompt: "When a web project shows an error, what is your go-to move?",
    focus: ["Copy-paste the error into ChatGPT / Google", "Debug line-by-line", "Ask a friend or mentor for help", "Re-watch the tutorial step"],
    linkHint: "Share a GitHub, Vercel, or Drive link if you have one.",
  },
  {
    id: "Content & Events",
    summary: "Writing, social media, campus events, and peer outreach.",
    tools: ["Social Media Writing", "Event Operations & Logistics", "Community & Peer Outreach", "Public Speaking & Hosting"],
    focusPrompt: "How do you prefer sharing ideas or updates with students?",
    focus: ["Short, punchy posts", "Short video or audio announcements", "Direct WhatsApp messages", "In-person classroom announcements"],
    linkHint: "Share a Google Doc, blog, or LinkedIn post if you have one.",
  },
  {
    id: "Fast Learner / Generalist",
    summary: "AI power use, operations, practical problem-solving, and quick learning.",
    tools: ["AI Tools Power-User", "Formatting Docs & Slides", "On-Ground Event Coordination", "Organizing Spreadsheets & Data", "Learning new tools quickly"],
    focusPrompt: "How do you prefer to master an unfamiliar software tool?",
    focus: ["Watch a fast YouTube walkthrough", "Click around and test directly", "Ask AI for a step-by-step breakdown", "Follow written documentation"],
    linkHint: "Share any Google Doc, Notion page, or project report if available.",
  },
] as const;

type TrackId = (typeof tracks)[number]["id"];

type FormState = {
  fullName: string;
  college: string;
  department: string;
  studyYear: "" | "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
  whatsapp: string;
  email: string;
  track: "" | TrackId;
  tools: string[];
  focus: string;
  portfolioLink: string;
  goal: "" | "Build real projects to boost my resume" | "Learn modern tools & AI workflows" | "Gain leadership & event experience" | "Connect with peers and mentors";
  workstation: "" | "I have my own personal laptop" | "I will use campus systems and foundation labs";
  consent: boolean;
};

const emptyForm: FormState = {
  fullName: "",
  college: "",
  department: "",
  studyYear: "",
  whatsapp: "",
  email: "",
  track: "",
  tools: [],
  focus: "",
  portfolioLink: "",
  goal: "",
  workstation: "",
  consent: false,
};

function canUseRedirect() {
  try {
    const url = new URL(POST_SUBMISSION_REDIRECT_URL);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const submitApplication = trpc.application.submit.useMutation();

  const currentTrack = useMemo(() => tracks.find((track) => track.id === form.track), [form.track]);
  const redirectEnabled = canUseRedirect();
  const remainingPrompts = remainingRequiredPrompts([
    form.fullName.trim(), form.college.trim(), form.department.trim(), form.studyYear,
    form.whatsapp.trim(), form.email.trim(), form.track, form.tools.length > 0,
    form.focus, form.goal, form.workstation, form.consent,
  ]);

  useEffect(() => {
    if (!submitted || !redirectEnabled) return;
    const timer = window.setTimeout(() => window.location.assign(POST_SUBMISSION_REDIRECT_URL), REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [submitted, redirectEnabled]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const toggleTool = (tool: string) => {
    setForm((previous) => ({
      ...previous,
      tools: previous.tools.includes(tool) ? previous.tools.filter((item) => item !== tool) : [...previous.tools, tool],
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName.trim() || !form.college.trim() || !form.department.trim() || !form.studyYear || !form.whatsapp.trim() || !form.email.trim() || !form.track) {
        return "Please complete all required profile details and choose one focus track.";
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address.";
    }
    if (step === 1 && (!form.tools.length || !form.focus)) return "Choose at least one capability and the answer that fits you best.";
    if (step === 2 && (!form.goal || !form.workstation || !form.consent)) return "Choose your goal and workstation access, then accept the consent statement.";
    return "";
  };

  const nextStep = () => {
    const validationMessage = validateStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, 2));
  };

  const submit = async () => {
    const validationMessage = validateStep();
    if (validationMessage || !form.track) {
      setError(validationMessage || "Choose a focus track before submitting.");
      return;
    }
    try {
      setError("");
      await submitApplication.mutateAsync({
        ...form,
        track: form.track,
        studyYear: form.studyYear as "1st Year" | "2nd Year" | "3rd Year" | "4th Year",
        goal: form.goal as "Build real projects to boost my resume" | "Learn modern tools & AI workflows" | "Gain leadership & event experience" | "Connect with peers and mentors",
        workstation: form.workstation as "I have my own personal laptop" | "I will use campus systems and foundation labs",
        consent: true,
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not save your application. Please try again.");
    }
  };

  const restart = () => {
    setForm(emptyForm);
    setError("");
    setStep(0);
    setSubmitted(false);
  };

  const openAbout = () => {
    trackCaptionEngagement("vvlf_caption_opened");
    setAboutOpen(true);
  };

  if (submitted) {
    return (
      <main className="vvlf-page" style={{ backgroundImage: `linear-gradient(rgba(247, 250, 255, 0.92), rgba(255, 251, 248, 0.94)), url(${ABSTRACT_FIELD})` }}>
        <section className="thank-you-shell">
          <img className="thank-you-logo" src={VVLF_LOGO} alt="Vishnu Venture Labs Foundation" />
          <div className="thank-you-card">
            <div className="success-orbit"><CheckCircle2 size={34} strokeWidth={2.4} /></div>
            <p className="eyebrow">Application received</p>
            <h1>Thank you for applying.</h1>
            <p className="thank-you-copy">Your application for the <strong>{form.track}</strong> track is now with the VVLF team. We look for drive, curiosity, and a willingness to learn—not only past experience.</p>
            {redirectEnabled ? (
              <p className="redirect-note"><ExternalLink size={16} /> Taking you to the next step now.</p>
            ) : (
              <p className="redirect-note"><Sparkles size={16} /> If selected for the next stage, the team will contact you through the details you provided.</p>
            )}
            {!redirectEnabled && <button className="text-button" type="button" onClick={restart}>Submit another application</button>}
          </div>
        </section>
      </main>
    );
  }

  const stageTitles = ["Your starting point", "Your working style", "One final check"];

  return (
    <main className="vvlf-page" style={{ backgroundImage: `linear-gradient(rgba(248, 250, 255, 0.9), rgba(255, 252, 249, 0.95)), url(${ABSTRACT_FIELD})` }}>
      <div className="application-shell">
        <aside className="identity-rail">
          <div className="logo-plaque"><img src={VVLF_LOGO} alt="Vishnu Venture Labs Foundation logo" /></div>
          <p className="rail-kicker">Student Innovation &amp; Portfolio Track</p>
          <h1>Build work that proves what you can become.</h1>
          <p className="rail-intro">No portfolio is required to begin. Bring your curiosity, choose a direction, and show us how you like to learn.</p>
          <div className="rail-stages" aria-label="Application stages">
            {stageTitles.map((title, index) => <div className={`rail-stage ${step === index ? "current" : ""} ${step > index ? "done" : ""}`} key={title}><span>{step > index ? <Check size={14} /> : `0${index + 1}`}</span><p>{title}</p></div>)}
          </div>
          <div className="rail-visual">
            <img src={HERO_IMAGE} alt="Student building a project in a creative workspace" />
            <button className="visual-caption" type="button" onClick={openAbout} aria-haspopup="dialog" aria-label="Learn about Vishnu Venture Labs Foundation">
              <img src={CAPTION_LOGO} alt="" aria-hidden="true" />
              <span>Turn curiosity into your next build. Meet VVLF.</span>
              <CircleHelp size={14} aria-hidden="true" />
            </button>
          </div>
        </aside>

        <section className="form-canvas">
          <header className="canvas-header">
            <div><span className="canvas-overline">VVLF application</span><p>Step {step + 1} of 3 · {remainingPrompts} required prompt{remainingPrompts === 1 ? "" : "s"} remaining</p></div>
            <div className="progress-track" aria-hidden="true"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
            <LockKeyhole size={18} aria-label="Private application" />
          </header>

          <div className="form-inner">
            {step === 0 && <section className="step-panel panel-enter">
              <p className="eyebrow">01 / Your starting point</p>
              <h2>Choose the work you are ready to grow into.</h2>
              <p className="step-intro">Tell us a little about yourself, then choose the direction that feels most exciting. This is not a test; it helps us shape the right project context for you.</p>
              <div className="trust-line"><CircleHelp size={17} /><span>Required fields are marked. Your answers are saved only when you submit.</span></div>
              <div className="field-grid">
                <label>Full name *<input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your full name" /></label>
                <label>College *<input value={form.college} onChange={(event) => update("college", event.target.value)} placeholder="College or university" /></label>
                <label>Department / branch *<input value={form.department} onChange={(event) => update("department", event.target.value)} placeholder="For example, CSE or ECE" /></label>
                <label>Current year *<select value={form.studyYear} onChange={(event) => update("studyYear", event.target.value as FormState["studyYear"])}><option value="">Choose one</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>
                <label>WhatsApp number *<input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="Including country code if relevant" inputMode="tel" /></label>
                <label>Email address *<input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" type="email" /></label>
              </div>
              <fieldset className="track-fieldset"><legend>Which focus track feels most exciting to you? *</legend><div className="track-grid">
                {tracks.map((track) => <button type="button" className={`track-card ${form.track === track.id ? "selected" : ""}`} onClick={() => { update("track", track.id); update("tools", []); update("focus", ""); }} key={track.id}><span className="track-index">{form.track === track.id ? <Check size={15} /> : "→"}</span><strong>{track.id}</strong><small>{track.summary}</small></button>)}
              </div></fieldset>
            </section>}

            {step === 1 && currentTrack && <section className="step-panel panel-enter">
              <p className="eyebrow">02 / Your working style</p>
              <h2>{currentTrack.id} is a great place to start.</h2>
              <p className="step-intro">You do not need to be an expert. We are more interested in the tools you are curious about and the way you approach a new challenge.</p>
              <fieldset className="choice-fieldset"><legend>What tools do you currently use or want to learn? *</legend><div className="choice-grid">
                {currentTrack.tools.map((tool) => <button className={`choice-card ${form.tools.includes(tool) ? "selected" : ""}`} type="button" onClick={() => toggleTool(tool)} key={tool}><span>{form.tools.includes(tool) ? <Check size={15} /> : "+"}</span>{tool}</button>)}
              </div></fieldset>
              <fieldset className="choice-fieldset"><legend>{currentTrack.focusPrompt} *</legend><div className="focus-list">
                {currentTrack.focus.map((focus) => <button className={`focus-choice ${form.focus === focus ? "selected" : ""}`} type="button" onClick={() => update("focus", focus)} key={focus}><span className="radio-dot" />{focus}</button>)}
              </div></fieldset>
              <label className="link-label">Optional sample or portfolio link<input value={form.portfolioLink} onChange={(event) => update("portfolioLink", event.target.value)} placeholder="https://..." /><small>{currentTrack.linkHint} No link? Leave it blank.</small></label>
            </section>}

            {step === 2 && <section className="step-panel panel-enter">
              <p className="eyebrow">03 / One final check</p>
              <h2>Tell us what you hope to take forward.</h2>
              <p className="step-intro">These last answers help VVLF understand the kind of growth and support that will be most useful to you.</p>
              <fieldset className="choice-fieldset"><legend>What is your primary goal for joining this track? *</legend><div className="focus-list">
                {["Build real projects to boost my resume", "Learn modern tools & AI workflows", "Gain leadership & event experience", "Connect with peers and mentors"].map((goal) => <button className={`focus-choice ${form.goal === goal ? "selected" : ""}`} type="button" onClick={() => update("goal", goal as FormState["goal"])} key={goal}><span className="radio-dot" />{goal}</button>)}
              </div></fieldset>
              <fieldset className="choice-fieldset"><legend>Workstation access *</legend><div className="choice-grid two-up">
                {["I have my own personal laptop", "I will use campus systems and foundation labs"].map((workstation) => <button className={`choice-card ${form.workstation === workstation ? "selected" : ""}`} type="button" onClick={() => update("workstation", workstation as FormState["workstation"])} key={workstation}><span>{form.workstation === workstation ? <Check size={15} /> : "+"}</span>{workstation}</button>)}
              </div></fieldset>
              <label className="consent"><input type="checkbox" required checked={form.consent} onChange={(event) => update("consent", event.target.checked)} /><span><strong>Privacy notice and consent *</strong><br />I confirm that my information is accurate. I agree that VVLF may securely use my contact and application details only to review this application, communicate about the program, and manage the selection process.</span></label>
              <div className="support-detail"><img src={WORKBENCH_IMAGE} alt="Student project workbench" /><p><strong>What happens next?</strong> After submission, your application is saved for the VVLF team. If your profile fits the next stage, they will use the contact details you provided.</p></div>
            </section>}

            {error && <p className="form-error" role="alert">{error}</p>}
          </div>

          <footer className="form-footer">
            <button className="secondary-action" type="button" disabled={step === 0 || submitApplication.isPending} onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }}><ArrowLeft size={17} /> Back</button>
            {step < 2 ? <button className="primary-action" type="button" onClick={nextStep}>Continue <ArrowRight size={17} /></button> : <button className="primary-action" type="button" disabled={submitApplication.isPending} onClick={submit}>{submitApplication.isPending ? "Saving application…" : "Submit application"} {!submitApplication.isPending && <ArrowRight size={17} />}</button>}
          </footer>
        </section>
      </div>
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="vvlf-about-dialog">
          <DialogHeader className="vvlf-about-header">
            <div className="vvlf-about-brand"><img src={CAPTION_LOGO} alt="" aria-hidden="true" /><span>VVLF / Incubation Center</span></div>
            <DialogTitle className="vvlf-about-title">From campus curiosity to real-world impact.</DialogTitle>
            <DialogDescription className="vvlf-about-copy">Vishnu Venture Labs Foundation is the B V Raju Institute of Technology Narsapur incubation center, helping early-stage innovators turn ideas into meaningful ventures through infrastructure, mentorship, and industry networks.</DialogDescription>
          </DialogHeader>
          <div className="vvlf-about-points" aria-label="Ways VVLF can help">
            <span>Validate ideas</span><span>Build prototypes</span><span>Meet mentors</span>
          </div>
          <DialogFooter className="vvlf-about-actions">
            <DialogClose asChild><button className="about-secondary-action" type="button">Continue application</button></DialogClose>
            <a className="about-primary-link" href={VVLF_WEBSITE_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackCaptionEngagement("vvlf_website_visit")}>Explore VVLF <ExternalLink size={15} aria-hidden="true" /></a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
