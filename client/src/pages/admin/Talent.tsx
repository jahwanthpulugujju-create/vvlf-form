import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import CandidateDetail from "./CandidateDetail";

const TIER_LABELS: Record<string, string> = {
  exceptional: "🔥 Exceptional",
  strong: "⭐ Strong",
  potential: "✅ Potential",
  review: "🟡 Review",
  low: "⚪ Low",
};

export default function Talent() {
  const appsQuery = trpc.admin.listApplications.useQuery(undefined, { refetchInterval: 30_000 });
  const updateCandidate = trpc.admin.updateCandidate.useMutation({ onSuccess: () => appsQuery.refetch() });

  const [minScore, setMinScore] = useState(70);
  const [trackFilter, setTrackFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [hasProofFilter, setHasProofFilter] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const apps = appsQuery.data ?? [];

  const tracks = useMemo(() => Array.from(new Set(apps.map((a) => a.track))).sort(), [apps]);
  const years = useMemo(() => Array.from(new Set(apps.map((a) => a.studyYear))).sort(), [apps]);

  const ranked = useMemo(() => {
    return [...apps]
      .filter((a) => {
        if (a.score < minScore) return false;
        if (trackFilter !== "all" && a.track !== trackFilter) return false;
        if (yearFilter !== "all" && a.studyYear !== yearFilter) return false;
        if (hasProofFilter && !a.portfolioLink) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [apps, minScore, trackFilter, yearFilter, hasProofFilter]);

  const tierCounts = useMemo(() => {
    const all = apps;
    return {
      exceptional: all.filter((a) => a.score >= 90).length,
      strong: all.filter((a) => a.score >= 80 && a.score < 90).length,
      potential: all.filter((a) => a.score >= 70 && a.score < 80).length,
    };
  }, [apps]);

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  return (
    <AdminLayout title="Talent Intelligence">
      {/* Tier summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { tier: "exceptional", label: "Exceptional", count: tierCounts.exceptional, color: "#dc2626", bg: "#fef2f2", threshold: "≥ 90" },
          { tier: "strong",      label: "Strong",      count: tierCounts.strong,      color: "#1d4ed8", bg: "#eff6ff", threshold: "≥ 80" },
          { tier: "potential",   label: "Potential",   count: tierCounts.potential,   color: "#059669", bg: "#f0fdf4", threshold: "≥ 70" },
        ].map(({ tier, label, count, color, bg, threshold }) => (
          <div key={tier} style={{
            background: bg,
            border: `1px solid ${color}30`,
            borderRadius: 12,
            padding: "16px 18px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, marginBottom: 6 }}>
              {TIER_LABELS[tier]}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color, opacity: 0.7, marginTop: 4 }}>Score {threshold}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div className="admin-panel-title">Top Candidates</div>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <label style={{ color: "#475569", fontWeight: 500 }}>Min Score:</label>
            <select
              className="admin-filter-select"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            >
              <option value={90}>90+ (Exceptional)</option>
              <option value={80}>80+ (Strong)</option>
              <option value={70}>70+ (Potential)</option>
              <option value={60}>60+ (Review)</option>
              <option value={0}>All Scores</option>
            </select>
          </div>
          <select className="admin-filter-select" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
            <option value="all">All Tracks</option>
            {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="admin-filter-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="all">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
            <input type="checkbox" checked={hasProofFilter} onChange={(e) => setHasProofFilter(e.target.checked)} />
            Has proof of work
          </label>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
            {ranked.length} candidates
          </span>
        </div>

        {/* Talent table */}
        {appsQuery.isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
        ) : ranked.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No candidates match the current filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Track</th>
                  <th>Year</th>
                  <th>Score</th>
                  <th>Tier</th>
                  <th>Top Skills</th>
                  <th>Role Fit</th>
                  <th>Status</th>
                  <th>PoW</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((app, i) => (
                  <tr key={app.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(app.id)}>
                    <td style={{ fontWeight: 700, color: i < 3 ? "#1d4ed8" : "#94a3b8", fontSize: i < 3 ? 15 : 13 }}>
                      #{i + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{app.fullName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.college}</div>
                    </td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{app.track.split(" & ")[0]}</td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{app.studyYear}</td>
                    <td>
                      <span style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: app.score >= 90 ? "#dc2626" : app.score >= 80 ? "#1d4ed8" : "#059669",
                      }}>
                        {app.score}
                      </span>
                    </td>
                    <td><span className={`score-badge ${app.tier}`}>{TIER_LABELS[app.tier]}</span></td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {app.skills.slice(0, 3).map((s: string) => (
                          <span key={s} style={{ fontSize: 10, background: "#f1f5f9", color: "#475569", padding: "1px 5px", borderRadius: 4 }}>{s}</span>
                        ))}
                        {app.skills.length > 3 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{app.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{app.recommendedRole ?? "—"}</td>
                    <td><span className={`status-badge ${app.status}`}>{app.status.replace("_", " ")}</span></td>
                    <td style={{ fontSize: 13 }}>
                      {app.portfolioLink ? (
                        <a
                          href={app.portfolioLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "#1d4ed8", fontSize: 11 }}
                        >
                          View ↗
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate drawer */}
      {selectedApp && (
        <CandidateDetail
          app={selectedApp}
          onClose={() => setSelectedId(null)}
          onUpdate={(id, updates) => updateCandidate.mutate({ id, ...updates })}
        />
      )}
    </AdminLayout>
  );
}
