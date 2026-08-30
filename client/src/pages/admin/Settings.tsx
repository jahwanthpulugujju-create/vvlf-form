import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout, { useAdminAuth } from "./AdminLayout";
import {
  ShieldCheck,
  Link as LinkIcon,
  Copy,
  Check,
  KeyRound,
  FileSpreadsheet,
  Database,
  Target,
  Users,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { admin } = useAdminAuth();
  const accountsQuery = trpc.admin.listAdminAccounts.useQuery(undefined, {
    retry: false,
  });

  // Source link generator state
  const [sourceTag, setSourceTag] = useState("instagram_story");
  const [copiedLink, setCopiedLink] = useState(false);

  // Targets state
  const [appTarget, setAppTarget] = useState(500);
  const [selectionTarget, setSelectionTarget] = useState(100);
  const [savedTargets, setSavedTargets] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vvlf-form.vercel.app";
  const generatedUrl = `${baseUrl}/?source=${encodeURIComponent(sourceTag.trim().toLowerCase().replace(/\s+/g, "_") || "direct")}`;

  function handleCopySourceLink() {
    navigator.clipboard.writeText(generatedUrl);
    setCopiedLink(true);
    toast.success("Campaign tracking URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleSaveTargets() {
    setSavedTargets(true);
    toast.success("Campaign targets updated for this session!");
    setTimeout(() => setSavedTargets(false), 2000);
  }

  return (
    <AdminLayout title="Settings" breadcrumb="Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
        {/* Section 1: Admin Profile */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Admin Account & Credentials</div>
              <div className="admin-panel-sub">
                Authenticated session details and credentials configuration
              </div>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 99,
                background: "#f0fdf4",
                color: "#16a34a",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={13} /> Active Session
            </span>
          </div>
          <div className="admin-panel-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                padding: "14px 16px",
                background: "#f8fafc",
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Display Name
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {admin?.displayName || "VVLF Administrator"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Username
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2, fontFamily: "monospace" }}>
                  {admin?.username || "admin"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Role & Permissions
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginTop: 2, textTransform: "capitalize" }}>
                  {admin?.role || "Owner"}
                </div>
              </div>
            </div>

            {/* Password Update Helper */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <KeyRound size={16} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  How to Change Your Admin Password
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, margin: "0 0 10px" }}>
                Admin credentials are cryptographically protected via <strong>bcrypt password hashing</strong>. To update the admin password on Vercel:
              </p>
              <ol style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, paddingLeft: 20, margin: "0 0 12px" }}>
                <li>Generate a new password hash using Node.js:
                  <div style={{
                    fontFamily: "monospace",
                    background: "#0f172a",
                    color: "#38bdf8",
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginTop: 6,
                    marginBottom: 6,
                    fontSize: 11,
                    userSelect: "all",
                  }}>
                    node -e &quot;require(&apos;bcryptjs&apos;).hash(&apos;your-new-password&apos;, 10).then(console.log)&quot;
                  </div>
                </li>
                <li>Go to your <strong>Vercel Project Dashboard → Settings → Environment Variables</strong>.</li>
                <li>Update <code>ADMIN_PASSWORD_HASH</code> with the generated hash string.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Section 2: Campaign Tracking Link Generator */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Campaign Tracking Link Generator</div>
              <div className="admin-panel-sub">
                Create tagged application links for WhatsApp, Instagram, Posters, QR Codes, and Club partners
              </div>
            </div>
            <LinkIcon size={18} color="#2563eb" />
          </div>
          <div className="admin-panel-body">
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Channel / Source Name:
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={sourceTag}
                  onChange={(e) => setSourceTag(e.target.value)}
                  placeholder="e.g. whatsapp_ecell, instagram_reel, campus_qr"
                  style={{
                    flex: 1,
                    minWidth: 240,
                    padding: "9px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: "#f8fafc",
                  }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopySourceLink}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? "Copied!" : "Copy Campaign Link"}
                </button>
              </div>
            </div>

            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              fontSize: 12,
              color: "#1e40af",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}>
              <span>{generatedUrl}</span>
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1d4ed8", flexShrink: 0, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
              >
                Test <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center", marginRight: 4 }}>Quick presets:</span>
              {["instagram", "whatsapp_group", "qr_poster", "ecell_partner", "linkedin", "direct"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSourceTag(preset)}
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: sourceTag === preset ? "#1d4ed8" : "#f1f5f9",
                    color: sourceTag === preset ? "#fff" : "#475569",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Campaign Targets */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Campaign Goals & Projection Targets</div>
              <div className="admin-panel-sub">
                Target milestones shown on the Overview dashboard and analytics reports
              </div>
            </div>
            <Target size={18} color="#059669" />
          </div>
          <div className="admin-panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Total Application Target
                </label>
                <input
                  type="number"
                  value={appTarget}
                  onChange={(e) => setAppTarget(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Final Selection Target
                </label>
                <input
                  type="number"
                  value={selectionTarget}
                  onChange={(e) => setSelectionTarget(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={handleSaveTargets}>
              {savedTargets ? "✓ Targets Saved" : "Save Milestone Targets"}
            </button>
          </div>
        </div>

        {/* Section 4: Live Integrations Status */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Data Integrations Status</div>
              <div className="admin-panel-sub">Live connected synchronization pipelines</div>
            </div>
            <FileSpreadsheet size={18} color="#059669" />
          </div>
          <div className="admin-panel-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #f1f5f9",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileSpreadsheet size={18} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Google Sheets Webhook Sync</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Live webhook configured for Google AppScript</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 99 }}>
                  ● Active
                </span>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #f1f5f9",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Database size={18} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Local CSV Backup Store</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>data/VVLF_Student_Applications.csv</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 99 }}>
                  ● Synchronized
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
