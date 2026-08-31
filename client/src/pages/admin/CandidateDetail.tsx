import { useState } from "react";
import { X, ExternalLink, MessageCircle, Mail } from "lucide-react";

interface App {
  id: number;
  fullName: string;
  college: string;
  department: string;
  studyYear: string;
  whatsapp: string;
  email: string;
  track: string;
  score: number;
  tier: string;
  scoreBreakdown: Record<string, number>;
  skills: string[];
  workAreas: string[];
  portfolioLink?: string | null;
  goal: string;
  workstation: string;
  status: string;
  notes: string;
  source?: string | null;
  recommendedRole?: string;
  availabilityHours?: string;
  contribution?: string;
  createdAt: Date | string;
}

interface CandidateDetailProps {
  app: App;
  onClose: () => void;
  onUpdate: (id: number, updates: { status?: string; notes?: string; scoreOverride?: number }) => void;
}

const TIER_LABELS: Record<string, string> = {
  exceptional: "🔥 Exceptional",
  strong: "⭐ Strong",
  potential: "✅ Potential",
  review: "🟡 Review",
  low: "⚪ Low Priority",
};

const STATUSES = [
  "new", "screening", "shortlisted", "challenge_sent", "challenge_done",
  "interview", "selected", "waitlisted", "rejected", "withdrawn",
] as const;

const SCORE_LABELS: Record<string, string> = {
  interestFit: "Interest Fit",
  skillDepth: "Skill Depth",
  proofOfWork: "Proof of Work",
  availability: "Availability",
  studyYear: "Study Year",
};
const SCORE_MAX: Record<string, number> = {
  interestFit: 20,
  skillDepth: 25,
  proofOfWork: 25,
  availability: 15,
  studyYear: 15,
};

export default function CandidateDetail({ app, onClose, onUpdate }: CandidateDetailProps) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [status, setStatus] = useState(app.status ?? "new");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onUpdate(app.id, { status, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function quickStatus(s: string) {
    setStatus(s);
    onUpdate(app.id, { status: s, notes });
  }

  return (
    <>
      {/* Overlay */}
      <div className="candidate-drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="candidate-drawer">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>CANDIDATE #{app.id}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{app.fullName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Quality Score */}
          <div className="drawer-section">
            <div className="drawer-section-label">Quality Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                fontSize: 40,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1,
              }}>
                {app.score}
              </div>
              <div>
                <div style={{ fontSize: 12 }}><span className={`score-badge ${app.tier}`}>{TIER_LABELS[app.tier]}</span></div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>out of 100</div>
              </div>
            </div>
            {Object.entries(SCORE_LABELS).map(([key, label]) => {
              const val = app.scoreBreakdown[key] ?? 0;
              const max = SCORE_MAX[key] ?? 25;
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div className="score-breakdown-row">
                    <span>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val} / {max}</span>
                  </div>
                  <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${(val / max) * 100}%`, height: "100%", background: "#2563eb", borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* About */}
          <div className="drawer-section">
            <div className="drawer-section-label">About</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>College</span><br /><strong>{app.college}</strong></div>
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Branch</span><br /><strong>{app.department}</strong></div>
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Year</span><br /><strong>{app.studyYear}</strong></div>
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Track</span><br /><strong>{app.track}</strong></div>
              {app.availabilityHours && (
                <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Availability</span><br /><strong>{app.availabilityHours}</strong></div>
              )}
              {app.recommendedRole && (
                <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Suggested Role</span><br /><strong>{app.recommendedRole}</strong></div>
              )}
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Source</span><br /><strong>{app.source ?? "Direct"}</strong></div>
              <div><span style={{ color: "#94a3b8", fontSize: 11 }}>Applied</span><br /><strong>{new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
            </div>
          </div>

          {/* Contact */}
          <div className="drawer-section">
            <div className="drawer-section-label">Contact & Next Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`mailto:${app.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1d4ed8", textDecoration: "none" }}>
                <Mail size={14} /> {app.email}
              </a>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`https://wa.me/91${app.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
                  <MessageCircle size={14} /> Chat: +91 {app.whatsapp}
                </a>
                <a
                  href={`https://wa.me/91${app.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${app.fullName.split(" ")[0]}! Thanks for applying to the VVLF Student Builder Program. Please follow this link to join our official WhatsApp group for further updates regarding the next steps: https://chat.whatsapp.com/J6xbYqXJ9UK3Z3iuYYD3U2?s=sh&p=a&mlu=4`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#166534", background: "#dcfce7", border: "1px solid #86efac", padding: "6px 10px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}
                  title="Send pre-filled message with group link"
                >
                  <MessageCircle size={14} /> Send Group Link Invite
                </a>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="drawer-section">
            <div className="drawer-section-label">Skills & Work Areas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {app.skills.map((s: string) => (
                <span key={s} style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 5, fontWeight: 500 }}>
                  {s}
                </span>
              ))}
            </div>
            {app.workAreas.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {app.workAreas.map((w: string) => (
                  <span key={w} style={{ fontSize: 11, background: "#f0fdf4", color: "#16a34a", padding: "3px 8px", borderRadius: 5 }}>
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Proof of Work */}
          {app.portfolioLink && (
            <div className="drawer-section">
              <div className="drawer-section-label">Proof of Work</div>
              <a
                href={app.portfolioLink}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1d4ed8" }}
              >
                <ExternalLink size={13} />
                {app.portfolioLink.length > 50 ? app.portfolioLink.slice(0, 50) + "…" : app.portfolioLink}
              </a>
            </div>
          )}

          {/* Status */}
          <div className="drawer-section">
            <div className="drawer-section-label">Pipeline Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
                marginBottom: 10,
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => quickStatus("shortlisted")}>
                ⭐ Shortlist
              </button>
              <button className="btn-danger" onClick={() => quickStatus("rejected")}>
                Reject
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="drawer-section">
            <div className="drawer-section-label">Internal Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reviewer notes…"
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                color: "#0f172a",
                background: "#f8fafc",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSave}>
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
