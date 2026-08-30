import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

export default function Skills() {
  const stats = trpc.admin.analyticsData.useQuery();

  if (stats.isLoading) {
    return <AdminLayout title="Skills"><div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div></AdminLayout>;
  }
  if (stats.error) {
    return <AdminLayout title="Skills"><div style={{ color: "#dc2626", fontSize: 13 }}>{stats.error.message}</div></AdminLayout>;
  }

  const d = stats.data!;
  const topSkills = d.skillFrequency.slice(0, 25);
  const maxSkillCount = topSkills[0]?.count || 1;

  const SKILL_TRACK_COLORS: Record<string, string> = {
    "Technology & Product": "#2563eb",
    "Startups & Business": "#7c3aed",
    "Creative & Media": "#ea580c",
    "Content & Community": "#059669",
    "Explore & Build": "#d97706",
  };

  return (
    <AdminLayout title="Skills">
      {/* Skill frequency heatmap */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Skill Frequency</div>
            <div className="admin-panel-sub">Top 25 skills across all applicants</div>
          </div>
        </div>
        <div className="admin-panel-body">
          {topSkills.map((s) => (
            <div key={s.skill} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{s.skill}</span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {s.tracks.slice(0, 3).map((t) => (
                      <span key={t} style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: SKILL_TRACK_COLORS[t] ? `${SKILL_TRACK_COLORS[t]}20` : "#f1f5f9",
                        color: SKILL_TRACK_COLORS[t] ?? "#64748b",
                        fontWeight: 600,
                      }}>
                        {t.split(" & ")[0].slice(0, 4).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", minWidth: 30, textAlign: "right" }}>
                  {s.count}
                </span>
              </div>
              <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  width: `${(s.count / maxSkillCount) * 100}%`,
                  height: "100%",
                  background: "#2563eb",
                  borderRadius: 99,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary interest combos + skills by track */}
      <div className="admin-chart-grid">
        {/* Interest combos */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Cross-functional Interest</div>
              <div className="admin-panel-sub">Top primary + secondary track combos</div>
            </div>
          </div>
          <div className="admin-panel-body">
            {d.interestCombos.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No secondary interest data yet.</div>
            ) : (
              d.interestCombos.map((combo) => (
                <div key={`${combo.primary}|${combo.secondary}`} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f8fafc",
                  fontSize: 12,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {combo.primary.split(" & ")[0]}
                    </span>
                    <span style={{ color: "#94a3b8", margin: "0 6px" }}>+</span>
                    <span style={{ color: "#475569" }}>
                      {combo.secondary.split(" & ")[0]}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: 700,
                    color: "#1d4ed8",
                    background: "#eff6ff",
                    padding: "2px 7px",
                    borderRadius: 5,
                    fontSize: 11,
                  }}>
                    {combo.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skill rarity highlight */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Rare Skills</div>
              <div className="admin-panel-sub">Skills with the fewest applicants — potential shortfalls</div>
            </div>
          </div>
          <div className="admin-panel-body">
            {d.skillFrequency.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No skill data yet.</div>
            ) : (
              [...d.skillFrequency]
                .reverse()
                .slice(0, 12)
                .map((s) => (
                  <div key={s.skill} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderBottom: "1px solid #f8fafc",
                    fontSize: 12,
                  }}>
                    <span style={{ color: "#475569" }}>{s.skill}</span>
                    <span style={{
                      fontWeight: 700,
                      color: s.count <= 3 ? "#dc2626" : "#d97706",
                      background: s.count <= 3 ? "#fef2f2" : "#fffbeb",
                      padding: "2px 7px",
                      borderRadius: 5,
                      fontSize: 11,
                    }}>
                      {s.count} {s.count <= 3 ? "⚠" : ""}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
