import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function Analytics() {
  const stats = trpc.admin.analyticsData.useQuery();

  if (stats.isLoading) {
    return <AdminLayout title="Analytics"><div style={{ color: "#64748b", fontSize: 13 }}>Loading analytics…</div></AdminLayout>;
  }
  if (stats.error) {
    return <AdminLayout title="Analytics"><div style={{ color: "#dc2626", fontSize: 13 }}>{stats.error.message}</div></AdminLayout>;
  }

  const d = stats.data!;
  const maxFunnel = d.funnel[0]?.count || 1;

  return (
    <AdminLayout title="Analytics">
      {/* Funnel */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Application Funnel</div>
            <div className="admin-panel-sub">
              Conversion at each stage · <span style={{ color: "#d97706" }}>Estimated</span> stages marked with ⁺
            </div>
          </div>
        </div>
        <div className="admin-panel-body">
          {d.funnel.map((stage, i) => (
            <div key={stage.stage} className="funnel-stage">
              <div className="funnel-label">
                {stage.isEstimated ? `⁺ ${stage.stage}` : stage.stage}
              </div>
              <div className="funnel-bar-wrap">
                <div
                  className="funnel-bar"
                  style={{
                    width: `${(stage.count / maxFunnel) * 100}%`,
                    background: i === d.funnel.length - 1 ? "#059669" : "#2563eb",
                  }}
                />
              </div>
              <div className="funnel-count">{stage.count.toLocaleString()}</div>
              <div className="funnel-conv">
                {stage.conversionFromPrev !== null ? (
                  <span style={{ color: stage.conversionFromPrev < 80 ? "#dc2626" : "#64748b" }}>
                    {stage.conversionFromPrev}%
                  </span>
                ) : "—"}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8" }}>
            ⁺ Estimated figures based on typical conversion rates. Enable funnel tracking for exact data.
          </div>
        </div>
      </div>

      {/* Score Distribution + Year Distribution */}
      <div className="admin-chart-grid" style={{ marginBottom: 20 }}>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Quality Score Distribution</div>
              <div className="admin-panel-sub">Candidates by score bucket</div>
            </div>
          </div>
          <div className="admin-panel-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.scoreDistribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }} />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {d.scoreDistribution.map((entry) => {
                    const color = entry.range === "90-100" ? "#dc2626"
                      : entry.range === "80-89" ? "#2563eb"
                      : entry.range === "70-79" ? "#059669"
                      : entry.range === "60-69" ? "#d97706"
                      : "#94a3b8";
                    return <Cell key={entry.range} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Year Distribution</div>
              <div className="admin-panel-sub">By current study year</div>
            </div>
          </div>
          <div className="admin-panel-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.yearDistribution} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="label" width={60} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }} />
                <Bar dataKey="count" name="Applicants" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Branch distribution */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Branch / Department Breakdown</div>
            <div className="admin-panel-sub">Top 10 departments</div>
          </div>
        </div>
        <div className="admin-panel-body">
          {d.branchDistribution.map((b) => (
            <div key={b.label} className="skill-bar-row">
              <div className="skill-bar-label">{b.label}</div>
              <div className="skill-bar-wrap">
                <div className="skill-bar-fill" style={{ width: `${b.pct}%`, background: "#7c3aed" }} />
              </div>
              <div className="skill-bar-count">{b.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Track quality */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Track Performance</div>
            <div className="admin-panel-sub">Applications, strong rate, and avg score by track</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Applications</th>
                <th>Strong (≥80)</th>
                <th>Strong Rate</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {d.trackDistribution.map((t) => (
                <tr key={t.track}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{t.track}</td>
                  <td>{t.count}</td>
                  <td>{t.strongCount}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${t.strongRate}%`, height: "100%", background: "#2563eb", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{t.strongRate}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: t.avgScore >= 80 ? "#1d4ed8" : t.avgScore >= 70 ? "#059669" : "#64748b",
                    }}>
                      {t.avgScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
